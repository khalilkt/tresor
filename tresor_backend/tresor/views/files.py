import os
from rest_framework import serializers
from rest_framework.views import APIView

from tresor.models.collection_operation import CollectionOperation
from tresor.models.disbursement_operation import DisbursementOperation    
from django.http import FileResponse, HttpResponse
import zipfile
    
def download_files(request, year, month, *args, **kwargs):
    query_params = request.GET 
    is_count_request = query_params.get("count", None)
    type = query_params.get("type", None)
    if not is_count_request or is_count_request not in ["true", "false"]:
        return HttpResponse("You must provide a count parameter", status=400)
    if not type or type not in ["collection", "disbursement"]:
        return HttpResponse("You must provide a type parameter", status=400)

    if type == "collection":
        instances = CollectionOperation.objects.filter(date__year=year, date__month=month).exclude(file=None)
    else:
        instances = DisbursementOperation.objects.filter(date__year=year, date__month=month).exclude(file=None) 

    if is_count_request == "true":
        return HttpResponse(instances.count())
 
    response = HttpResponse(content_type='application/zip')
    zip_file = zipfile.ZipFile(response, 'w')

    for instance in instances:
        if not instance.file:
            continue
        file_path = instance.file.path
        file_name = os.path.basename(file_path)
        zip_file.write(file_path, file_name)

    zip_file.close()
    name = ""
    if type == "collection":
        name = "Encaissements"
    else:
        name = "Décaissements"
    name = f"{name}_{year}_{month}.zip"
    response['Content-Disposition'] = f'attachment; filename="{name}"'
    return response
    
