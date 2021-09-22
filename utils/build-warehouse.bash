#!/bin/bash

# This script:
#   i) reads a DDL file
#   ii) Populates an AWS Athena database backed by the AWS Glue
#       catalog using the statements from the DDL file
#   iii) Optionally executes statements against a Redshift cluster
#        to expose the Glue catalog to Redshift via Redshift Spectrum
#
# You will need the aws-cli to be configured with an appropriate
# administrator-level profile to run the commands in this script.

# This causes the script to fail and exit if any error occurs
set -euo pipefail

# IMPORTANT!
# set CAUSAL_SQL to the location of the generated SQL file
# In this example, assumed to be causal.sql and assumed to run
# In the directory where the generated sql file is
CAUSAL_SQL=causal.sql

# IMPORTANT!
# set OUTPUT_LOCATION to the location where you want athena responses to be placed
# the bucket below is an example and needs to be changed
OUTPUT_LOCATION=s3://causal-getting-started-1/ddlexecution/

# IMPORTANT!
# set DB_NAME to your database name
DB_NAME=getting_started

# IMPORTANT!
# If this and below lines are uncommented, then this script will execute statments against
# your Amazon Redshift cluster to expose the AWS Glue catalog data via Redshift Spectrum
# external tables
# REDSHIFT_CLUSTER_IDENTIFIER=redshift-cluster-1
# REDSHIFT_DATABASE_NAME=dev
# REDSHIFT_SECRET_ARN="arn:aws:secretsmanager:<region>:<aws account id>:secret:<secret name>"
# REDSHIFT_ROLE_NAME=MyRedshiftRoleName
# GLUE_DATA_CATALOG_REGION=us-east-1

# create the database
# you only need to to do this once
aws athena start-query-execution --query-string "create database if not exists $DB_NAME;" --result-configuration "OutputLocation=$OUTPUT_LOCATION"

# temp directory to hold sql file for each statements
# athena command line does not work with multiple statements, it can only process one statement at a time
TMP_DIR=$(mktemp -d)

# split file into separate statements
# causal uses ---- to separate statements in the file
csplit --elide-empty-files --prefix $TMP_DIR/causalsplit --suffix-format='%05d.sql' $CAUSAL_SQL /----/ '{*}'

# remove any cruft
sed -i -r -e '/^\s*$/d' -e '/^----$/d' $TMP_DIR/*.sql
find $TMP_DIR -size 0 -print -delete

# execute each statement
# athena command line does not work with multiple statements, it can only process one statement at a time
for f in $TMP_DIR/*.sql; do
    echo "Processing $f file.."
    aws athena start-query-execution --query-string "$(<$f)" --result-configuration "OutputLocation=$OUTPUT_LOCATION" --query-execution-context Database=$DB_NAME
    sleep 2
done

if [ ! -z ${REDSHIFT_CLUSTER_IDENTIFIER+x} ]; then
    # Create the external schema Amazon Redshift Spectrum
    REDSHIFT_ROLE_ARN=$(aws iam get-role --role-name=$REDSHIFT_ROLE_NAME --output text --query Role.Arn)
    aws redshift-data execute-statement --cluster-identifier=$REDSHIFT_CLUSTER_IDENTIFIER --database=$REDSHIFT_DATABASE_NAME --secret-arn=$REDSHIFT_SECRET_ARN --sql \
        "create external schema $DB_NAME from data catalog database '$DB_NAME' iam_role '$REDSHIFT_ROLE_ARN' region '$GLUE_DATA_CATALOG_REGION' create external database if not exists;"
fi

# cleanup
rm $TMP_DIR/causalsplit*.sql
rmdir $TMP_DIR
