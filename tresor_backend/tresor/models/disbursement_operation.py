from datetime import timezone
from django.db import models
from django.db import transaction
from django.db.models import F, Sum
from rest_framework import serializers
from ..models.account import Account, AccountSerializer

class DisbursementOperationManager(models.Manager):
    def get_queryset(self):
        ret = super().get_queryset()
        ret = ret.annotate(total = Sum('details__montant'))
        ret = ret.annotate(account_name = F('account__name'))
        ret = ret.annotate(created_by_name = F('created_by__username'))
        return ret
    
class DisbursementOperation(models.Model):
    date = models.DateField()
    account = models.ForeignKey('Account', on_delete=models.CASCADE, related_name='disbursement_operations') 
    motif = models.CharField(max_length=255)
    beneficiaire = models.CharField(max_length=255)
    ref = models.CharField(max_length=20, editable=False)
    type = models.CharField(max_length=255, choices=[('frais', 'Frais'), ('operation', 'Operation')], default='operation')
    file = models.FileField(upload_to='disbursement_files/%Y/%m/%d/', null=True, blank=True)


    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('authentication.User', on_delete=models.PROTECT, related_name='disbursement_operations')

    objects = DisbursementOperationManager()

    def save(self, *args, **kwargs):
        if not self.pk:
            if self.type != "operation":
                self.ref = "-"
            else:
                last = DisbursementOperation.objects.filter(date__year=self.date.year, type="operation").order_by('created_at').last()
                ref_number = 1
                if last and len(last.ref.split("/")) > 1:
                    last_ref = last.ref.split('/')[0]
                    ref_number = int(last_ref) + 1
                if self.date.year == 2024 and ref_number <= 464:
                    ref_number = 465
                self.ref = f"{ref_number:04d}/{self.date.year}/DTNDB"  
        super().save(*args, **kwargs)

class DisbursementOperationDetail(models.Model):
    parent = models.ForeignKey(DisbursementOperation, on_delete=models.CASCADE, related_name='details')
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    name = models.CharField(max_length=255)
    banq_name = models.CharField(max_length=255)
    banq_number = models.CharField(max_length=255)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class DisbursementOperationDetailSerializer(serializers.ModelSerializer):
        class Meta:
            model = DisbursementOperationDetail
            exclude = ['parent']

class DisbursementOperationSerializer(serializers.ModelSerializer):
     
    details = DisbursementOperationDetailSerializer(many=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    created_by_name = serializers.CharField(read_only=True)
    account_name = serializers.CharField( read_only=True)
    account_data = AccountSerializer(source='account', read_only=True)

    class Meta:
        model = DisbursementOperation
        fields = '__all__'
        read_only_fields = ["created_by"]

    def validate_details(self, value):  
        type = self.initial_data['type'] or "operation"

        if len(value) == 0:
            raise serializers.ValidationError("EMPTY_DETAILS")
        if type == "frais" and len(value) != 1:
            raise serializers.ValidationError("INVALID_DETAILS")


        account = Account.objects.get(pk=self.initial_data['account'])
        total = 0
        for item in value:
            total += item['montant']
        if total > account.balance:
            raise serializers.ValidationError("NOT_ENOUGH_BALANCE")
        return value


    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        children = validated_data.pop('details')
        with transaction.atomic():
            parent = DisbursementOperation.objects.create(**validated_data)
            total = 0
            for child in children:
                c =DisbursementOperationDetail.objects.create(parent=parent, **child)

                total += c.montant
            
            account = parent.account
            account.balance -= total
            account.save()
        return parent


        
