# Generated by Django 5.0.4 on 2024-06-23 19:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tresor', '0003_rename_virement_collectionoperation_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='collectionoperationdetail',
            name='name',
            field=models.CharField(default='', max_length=255),
            preserve_default=False,
        ),
    ]
