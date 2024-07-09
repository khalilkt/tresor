from django.db import models    
from rest_framework import serializers

class Account(models.Model):
    name = models.CharField(max_length=255, unique=True)
    number = models.CharField(max_length=255)
    balance = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name + " - " + self.number
    
    def get_solde_at_date(self, date):
        # we will get all the operrations done after the date and we will calculate the balance
        # we will get all the collection operations details and disbursement operations
        collection_operations_details = self.collection_operations_details.filter(parent__date__gte=date)
        disbursement_operations = self.disbursement_operations.filter(date__gte=date)
        fund_transfers = self.fund_transfers.filter(created_at__gte=date)

        solde = self.balance
        for operation_detail in collection_operations_details:
            solde -= operation_detail.montant
        for fund_transfer in fund_transfers:
            solde -= fund_transfer.amount
        for operation in disbursement_operations:
            solde += operation.total
        return solde
        

    
class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']