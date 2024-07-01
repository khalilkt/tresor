from tresor.utils import filter_query_by_date
from ..models.collection_operation import CollectionOperation, CollectionOperationSerializer
from rest_framework.generics import ListCreateAPIView, RetrieveAPIView, RetrieveUpdateAPIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAdminUser, IsAuthenticated



class CollectionOperationListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CollectionOperationSerializer
    filterset_fields = ['created_by', 'type']
    search_fields = ['motif', 'beneficiaire']
    ordering_fields = ['date', 'motif', 'beneficiaire']
    ordering = ['-date', '-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return CollectionOperation.objects.all()
        return CollectionOperation.objects.filter(created_by=user)

    def filter_queryset(self, queryset):
        ret =  super().filter_queryset(queryset)
        date = self.request.query_params.get('date', None)
        if date is not None:
            ret = filter_query_by_date(ret, date)
        return ret
    
    @property
    def pagination_class(self):
        if self.request.query_params.get('all', False) == "true":
            return None
        return super().pagination_class
    
    


class CollectionOperationDetail(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = CollectionOperation.objects.all()
    serializer_class = CollectionOperationSerializer
    
        

        


    
