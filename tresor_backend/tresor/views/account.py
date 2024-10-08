from rest_framework.viewsets import ModelViewSet

from tresor.utils import filter_query_by_date
from ..models.account import Account, AccountSerializer
from rest_framework.permissions import IsAdminUser  , IsAuthenticated
from rest_framework.views import APIView, Response
from django.db.models import F , Value
from ..models import DisbursementOperation, CollectionOperation, CollectionOperationDetail
from rest_framework import serializers
from django.db.models import Sum
from ..models import Vault, VaultGroup
from tresor.models.vault import Vault, VaultDeposit, VaultWithdrawal

class AccountViewSet(ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    filterset_fields = [] 
    search_fields = ["name", "number" ]
    ordering_fileds = ["balance", "name", "number"]
    ordering = ['-balance']
    pagination_class = None


class ReleveSerializer(serializers.Serializer):
    date = serializers.DateField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    operation_name = serializers.CharField()
    type = serializers.CharField()
    meta_data = serializers.DictField()

class StatsView(APIView):
    def get(self, request):
        date = request.query_params.get('date', None)
            
        total_solde = Account.objects.aggregate(total_solde= Sum('balance'))['total_solde']
        total_disbursement = filter_query_by_date(DisbursementOperation.objects, date).aggregate(total_disbursement= Sum('total'))['total_disbursement'] or 0
        total_collection = filter_query_by_date(CollectionOperation.objects, date).aggregate(total_collection= Sum('total'))['total_collection'] or 0
        collections_count = filter_query_by_date(CollectionOperation.objects, date).count()
        disbursements_count = filter_query_by_date(DisbursementOperation.objects, date).count()
        accounts_count = Account.objects.count()

        groups_stats = {}
        for group in VaultGroup.objects.all():
            total_vault_solde = group.vaults.aggregate(total_solde= Sum('balance'))['total_solde']
            total_vault_deposit = filter_query_by_date(VaultDeposit.objects.filter(vault__group=group), date).aggregate(total_deposit= Sum('amount'))['total_deposit'] or 0
            total_vault_withdrawal = filter_query_by_date(VaultWithdrawal.objects.filter(vault__group=group), date).aggregate(total_withdrawal= Sum('amount'))['total_withdrawal'] or 0
            deposits_count = filter_query_by_date(VaultDeposit.objects.filter(vault__group=group), date).count()
            withdrawals_count = filter_query_by_date(VaultWithdrawal.objects.filter(vault__group=group), date).count()
            groups_stats[group.name] = {
                "total_vault_solde": total_vault_solde,
                "total_vault_deposit": total_vault_deposit,
                "total_vault_withdrawal": total_vault_withdrawal,
                "deposits_count": deposits_count,
                "withdrawals_count": withdrawals_count,
            }


        return Response({
            "total_solde": total_solde,
            "total_disbursement": total_disbursement,
            "total_collection": total_collection, 
            "collections_count": collections_count,
            "disbursements_count": disbursements_count,
            "accounts_count": accounts_count,

            "groups_stats": groups_stats
        })
    


class AccountReleve(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request, pk):
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        if start_date is None or end_date is None:
            return Response({"error": "start_date and end_date are required"}, status=400)
        if start_date > end_date:
            return Response({"error": "start_date must be less than end_date"}, status=400)
        try:
            account = Account.objects.get(pk=pk)
        except Account.DoesNotExist:
            return Response({"error": "Account not found"}, status=404)

        releve = []
        total_change = 0
        for operation_detail in account.collection_operations_details.filter(parent__date__gte=start_date, parent__date__lte=end_date):
            total_change += operation_detail.montant
            operation_name = operation_detail.parent.motif
            if operation_detail.parent.type == "operation":
                operation_name =  "Versement de cheque N° " + operation_detail.cheque_number
            releve.append({
                "date": operation_detail.parent.date,
                "amount": operation_detail.montant,
                "operation_name": operation_name,
                "meta_data" : {
                    "cheque_number": operation_detail.cheque_number,
                    "name": operation_detail.name,
                    "banq_name": operation_detail.banq_name,
                    "destination_account": operation_detail.destination_account.name,
                    "operation_type": operation_detail.parent.type
                },
                "type": "collection"    
            })
        for operation in account.disbursement_operations.filter(date__gte=start_date, date__lte=end_date):
            total_change -= operation.total
            releve.append({
                "date": operation.date,
                "amount": operation.total,
                "operation_name": operation.motif,
                "type": "disbursement",
                "meta_data": {
                    "account_name": operation.account.name
                }
            })
        for fund_transfer in account.fund_transfers.filter(date__gte=start_date, date__lte=end_date):
            total_change += fund_transfer.amount
            releve.append({
                "date": fund_transfer.date,
                "amount": fund_transfer.amount, 
                "operation_name": fund_transfer.motif,
                "type": "fund_transfer",
                "meta_data": {
                    "account_name": fund_transfer.account.name
                }
            })
        releve.sort(key=lambda x: x['date'])

        serializer = ReleveSerializer(releve, many=True)

        end_date_solde = account.get_solde_at_date(end_date)
        return Response(
           { 
            "start_date_balance": end_date_solde - total_change,
            "end_date_balance":  end_date_solde,
            "data": serializer.data}
        )