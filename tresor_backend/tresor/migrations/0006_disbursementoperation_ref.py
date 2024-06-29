from django.db import migrations, models
from django.utils import timezone

def generate_ref(apps, schema_editor):
    DisbursementOperation = apps.get_model('tresor', 'DisbursementOperation')
    for year in DisbursementOperation.objects.dates('created_at', 'year'):
        operations = list(DisbursementOperation.objects.filter(created_at__year=year.year).order_by('created_at'))
        for index, obj in enumerate(operations, start=1):
            obj.ref = f"{year.year}-{index:04d}"
            obj.save()

class Migration(migrations.Migration):

    dependencies = [
        ('tresor', '0005_disbursementoperation_disbursementoperationdetail'),
    ]

    operations = [
        # Add the field without the unique constraint
        migrations.AddField(
            model_name='disbursementoperation',
            name='ref',
            field=models.CharField(max_length=20, editable=False, default=''),
            preserve_default=False,
        ),
        # Run the function to populate the field
        migrations.RunPython(generate_ref),
        # Add the unique constraint to the field
        migrations.AlterField(
            model_name='disbursementoperation',
            name='ref',
            field=models.CharField(max_length=20, unique=True, editable=False),
        ),
    ]
