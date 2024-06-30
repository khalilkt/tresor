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
    ref = models.CharField(max_length=20, unique=True, editable=False)
    type = models.CharField(max_length=255, choices=[('frais', 'Frais'), ('operation', 'Operation')], default='operation')


    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('authentication.User', on_delete=models.PROTECT, related_name='disbursement_operations')

    objects = DisbursementOperationManager()

    def save(self, *args, **kwargs):
        if not self.pk:  # Only set ref if the object is being created for the first time
            year = self.date.year
            count = DisbursementOperation.objects.filter(date__year=year).count() + 1
            self.ref = f"{year}-{count:04d}"  # Format as 2024-0013

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


        
