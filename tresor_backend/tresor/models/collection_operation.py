from collections import defaultdict
from django.db import models
from rest_framework import serializers
from django.db import transaction
from ..models.account import AccountSerializer, Account


class CollectionOperationManager(models.Manager):
    def get_queryset(self):
        ret = super().get_queryset()
        ret = ret.annotate(total = models.Sum('details__montant'))
        return ret

class CollectionOperation(models.Model):
    date = models.DateField()
    motif = models.CharField(max_length=255)
    beneficiaire = models.CharField(max_length=255)
    ref = models.CharField(max_length=20, unique=True, editable=False)
    type = models.CharField(max_length=255, choices=[('rejected', 'Rejected'), ('versement', 'Versement'), ('operation', 'Operation')], default='operation')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('authentication.User', on_delete=models.PROTECT, related_name='collection_operations')

    def save(self, *args, **kwargs):
        if not self.pk:  # Only set ref if the object is being created for the first time
            year = self.date.year
            count = CollectionOperation.objects.filter(date__year=year).count() + 1
            self.ref = f"{year}-{count:04d}"  # Format as 2024-0013

        super().save(*args, **kwargs)
    objects = CollectionOperationManager()

class CollectionOperationDetail(models.Model):
    parent = models.ForeignKey(CollectionOperation, on_delete=models.CASCADE, related_name='details')
    cheque_number = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    banq_name = models.CharField(max_length=255)
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    destination_account = models.ForeignKey('Account', on_delete=models.PROTECT , related_name='collection_operations_details') 

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class CollectionOperationDetailSerializer(serializers.ModelSerializer):
    account_data = AccountSerializer(source='destination_account', read_only=True)
    class Meta:
        model = CollectionOperationDetail
        exclude = ['parent']


class CollectionOperationSerializer(serializers.ModelSerializer):
    details = CollectionOperationDetailSerializer(many=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    def validate_details(self, value):  
        type = self.initial_data.get('type' , "operation")

        if len(value) == 0:
            raise serializers.ValidationError("EMPTY_DETAILS")
        if type != "operation" and len(value) != 1:
            raise serializers.ValidationError("INVALID_DETAILS")
        

        return value

    class Meta:
        model = CollectionOperation
        fields = '__all__'
        read_only_fields = ['created_by']

    

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        children = validated_data.pop('details')
        account_increments = defaultdict(int)
        with transaction.atomic():
            parent = CollectionOperation.objects.create(**validated_data)
            for child in children:
                c =CollectionOperationDetail.objects.create(parent=parent, **child)
                account_increments[c.destination_account] += c.montant
  
            for account, increment in account_increments.items():
                account.balance += increment
                account.save()
        return parent

                
