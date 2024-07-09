from rest_framework.generics import ListAPIView
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework import viewsets
from ..models.vault import *
from rest_framework.permissions import IsAdminUser, BasePermission , IsAuthenticated
from django.db.models import F
from rest_framework.response import Response
from rest_framework import status
from rest_framework.filters import SearchFilter
from django.db import transaction
from rest_framework.views import APIView

# class HasVaultAccessPermission(BasePermission):
#     def has_permission(self, request, view):
#         return request.user.is_authenticated and (request.user.is_superuser or request.user.is_admin or request.user.has_vaults_access)

class VaultGroupListView(ListAPIView):
    queryset = VaultGroup.objects.all()
    serializer_class = VaultGroupSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

class VaultListView(ListAPIView):
    queryset = Vault.objects.all().annotate(can_fund_transfer=F("group__can_fund_transfer"))
    serializer_class = VaultSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['group']
    pagination_class = None
    ordering = ['group']

class VaultDetailView(RetrieveUpdateAPIView):
    queryset = Vault.objects.all()
    serializer_class = VaultSerializer
    permission_classes = [IsAuthenticated]

class VaultDepositViewSet(viewsets.ModelViewSet):
    queryset = VaultDeposit.objects.all().annotate(vault_name=F('vault__name'))
    serializer_class = VaultDepositSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['-created_at']
    search_fields = ['motif']

    def get_queryset(self):
        user = self.request.user
        ret = super().get_queryset()   
        return ret

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        params = self.request.query_params
        if "group" in params:
            group = params["group"]
            queryset = queryset.filter(vault__group=group)
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        vault = instance.vault
        if vault.balance < instance.amount:
            return Response("NOT_ENOUGH_BALANCE", status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            vault.balance -= instance.amount
            vault.save()
            instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class VaultWithdrawalViewSet(viewsets.ModelViewSet):
    queryset = VaultWithdrawal.objects.all().annotate(vault_name=F('vault__name'), account_name=F('account__name'))
    serializer_class = VaultWithdrawalSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['-created_at']
    search_fields = ['motif']


    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        vault = instance.vault
        with transaction.atomic():
            vault.balance += instance.amount
            vault.save()
            if instance.account is not None:
                instance.account.balance -= instance.amount
                instance.account.save()
            instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        params = self.request.query_params
        if "group" in params:
            group = params["group"]
            queryset = queryset.filter(vault__group=group)
        return queryset
    
class VaultReleve(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request, pk): 
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        if start_date is None or end_date is None:
            return Response({"error": "start_date and end_date are required"}, status=400)
        if start_date > end_date:
            return Response({"error": "start_date must be less than end_date"}, status=400)
        try:
            vault = Vault.objects.get(pk=pk)
        except Vault.DoesNotExist:
            return Response({"error": "Vault not found"}, status=404)
        
        releve = []
        total_change = 0

        for deposit in vault.deposits.filter(created_at__gte=start_date, created_at__lte=end_date):
            total_change += deposit.amount
            releve.append({
                "date": deposit.created_at,
                "amount": deposit.amount,
                "operation_name": deposit.motif,
                "type": "deposit",
                "meta_data": {
                    # "account_name": deposit.account.name
                }
            })
        for withdrawal in vault.withdrawals.filter(created_at__gte=start_date, created_at__lte=end_date):
            total_change -= withdrawal.amount
            releve.append({
                "date": withdrawal.created_at,
                "amount": withdrawal.amount,
                "operation_name": withdrawal.motif,
                "type": "withdrawal",
                "meta_data": {
                    # "account_name": withdrawal.account.name
                }
            })
        
        releve = sorted(releve, key=lambda x: x["date"])
        end_date_balance = vault.get_solde_at_date(end_date)
        return Response(
            { 
                "start_date_balance": end_date_balance - total_change,
                "end_date_balance" : end_date_balance,
                "data": releve
            }
        )