# Generated by Django 5.0.4 on 2024-07-01 14:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tresor', '0012_collectionoperation_file'),
    ]

    operations = [
        migrations.AddField(
            model_name='disbursementoperation',
            name='file',
            field=models.FileField(blank=True, null=True, upload_to='disbursement_files/%Y/%m/%d/'),
        ),
    ]
