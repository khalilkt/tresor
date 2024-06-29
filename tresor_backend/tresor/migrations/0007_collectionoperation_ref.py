from django.db import migrations, models
from django.utils import timezone

def generate_ref(apps, schema_editor):
    CollectionOperation = apps.get_model('tresor', 'CollectionOperation')
    for year in CollectionOperation.objects.dates('date', 'year'):
        operations = list(CollectionOperation.objects.filter(date__year=year.year).order_by('date'))
        for index, obj in enumerate(operations, start=1):
            obj.ref = f"{year.year}-{index:04d}"
            obj.save()

class Migration(migrations.Migration):

    dependencies = [
        ('tresor', '0006_disbursementoperation_ref'),
    ]

    operations = [
        # Add the field without the unique constraint
        migrations.AddField(
            model_name='collectionoperation',
            name='ref',
            field=models.CharField(max_length=20, editable=False, default=''),
            preserve_default=False,
        ),
        # Run the function to populate the field
        migrations.RunPython(generate_ref),
        # Add the unique constraint to the field
        migrations.AlterField(
            model_name='collectionoperation',
            name='ref',
            field=models.CharField(max_length=20, unique=True, editable=False),
        ),
    ]

