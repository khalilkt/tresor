# Generated by Django 5.0.4 on 2024-07-01 14:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tresor', '0011_collectionoperation_created_by_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='collectionoperation',
            name='file',
            field=models.FileField(blank=True, null=True, upload_to='collection_files/%Y/%m/%d/'),
        ),
    ]
