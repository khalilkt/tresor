from django.db import models
from .account import Account
from rest_framework import serializers
from django.db import transaction

class VaultGroup(models.Model):
    name = models.CharField(max_length=255)
    can_fund_transfer = models.BooleanField(default=False)

class VaultManager(models.Manager):
    def get_queryset(self):
        ret = super().get_queryset()
        ret = ret.annotate(group_name = models.F('group__name'))
        return ret
class Vault(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=255)
    balance = models.DecimalField(max_digits=10, decimal_places=2)
    group = models.ForeignKey(VaultGroup, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class VaultSerializer(serializers.ModelSerializer):
    can_fund_transfer = serializers.BooleanField(read_only=True)
    group_name = serializers.CharField(read_only=True)
    class Meta:
        model = Vault
        fields = '__all__'
        

class VaultDeposit(models.Model):
    vault = models.ForeignKey(Vault, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    motif = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class VaultDepositSerializer(serializers.ModelSerializer):
    vault_name = serializers.CharField(read_only=True)
    class Meta:
        model = VaultDeposit
        fields = '__all__'

    def create(self, validated_data):
        instance = super().create(validated_data)
        vault = instance.vault
        vault.balance += instance.amount
        vault.save()
        return instance

class VaultWithdrawal(models.Model):
    vault = models.ForeignKey(Vault, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    motif = models.TextField()
    account = models.ForeignKey(Account, on_delete=models.CASCADE, null=True, blank=True)#if account is not null => degagement de fonds
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class VaultWithdrawalSerializer(serializers.ModelSerializer):
    vault_name = serializers.CharField(read_only=True)
    account_name = serializers.CharField(read_only=True)
    class Meta:
        model = VaultWithdrawal
        fields = '__all__'
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        vault = self.initial_data.get('vault')
        vault = Vault.objects.get(pk=vault)
        if vault is not None and value > vault.balance:
            raise serializers.ValidationError("NOT_ENOUGH_BALANCE")
        return value

    def create(self, validated_data):
        with transaction.atomic():
            instance = super().create(validated_data)
            vault = instance.vault
            vault.balance -= instance.amount
            vault.save()

            if instance.account is not None:
                instance.account.balance += instance.amount
                instance.account.save()
        return instance

# from django.test import TestCase
# from .models import Vault, VaultDeposit, VaultWithdrawal
# from .serializers import VaultDepositSerializer, VaultWithdrawalSerializer

# class VaultTests(TestCase):
#     def setUp(self):
#         self.vault = Vault.objects.create(name='Test Vault', balance=100.00)

#     def test_vault_deposit(self):
#         deposit_data = {
#             'vault': self.vault,
#             'amount': 50.00,
#             'motif': 'Test Deposit'
#         }
#         serializer = VaultDepositSerializer(data=deposit_data)
#         self.assertTrue(serializer.is_valid())
#         deposit = serializer.save()

#         self.assertEqual(deposit.vault, self.vault)
#         self.assertEqual(deposit.amount, 50.00)
#         self.assertEqual(deposit.motif, 'Test Deposit')

#         self.assertEqual(self.vault.balance, 150.00)

#     def test_vault_withdrawal(self):
#         withdrawal_data = {
#             'vault': self.vault,
#             'amount': 50.00,
#             'motif': 'Test Withdrawal'
#         }
#         serializer = VaultWithdrawalSerializer(data=withdrawal_data)
#         self.assertTrue(serializer.is_valid())
#         withdrawal = serializer.save()

#         self.assertEqual(withdrawal.vault, self.vault)
#         self.assertEqual(withdrawal.amount, 50.00)
#         self.assertEqual(withdrawal.motif, 'Test Withdrawal')

#         self.assertEqual(self.vault.balance, 50.00)

#     def test_vault_withdrawal_insufficient_balance(self):
#         withdrawal_data = {
#             'vault': self.vault,
#             'amount': 200.00,
#             'motif': 'Test Withdrawal'
#         }
#         serializer = VaultWithdrawalSerializer(data=withdrawal_data)
#         self.assertFalse(serializer.is_valid())
#         self.assertEqual(serializer.errors['non_field_errors'][0], 'NOT_ENOUGH_BALANCE')

#         self.assertEqual(self.vault.balance, 100.00)