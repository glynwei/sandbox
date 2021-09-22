#!/usr/bin/env python3

# build-warehouse.py
#
# This script:
#   i) reads a DDL file
#   ii) Populates an AWS Athena database backed by the AWS Glue
#       catalog using the statements from the DDL file
#   iii) Optionally executes statements against a Redshift cluster
#        to expose the Glue catalog to Redshift via Redshift Spectrum
#   ex: python3 build-warehouse.py --output-location "s3://causal-redshift-test-bucket/ddlexecution/" --database causal_redshift_test --create \
#       --redshift-cluster-identifier redshift-cluster-1 --redshift-role-name ChrisRedshiftSpectrumRole --redshift-database dev \
#       --redshift-secret-arn "arn:aws:secretsmanager:us-east-1:866349338809:secret:redshift/dbsecret-xVdIik" \
#       --glue-data-catalog-region=us-east-1 causal.sql
#
#   You will need the aws-cli to be configured with an appropriate
#   administrator-level profile to run the commands in this script.

import boto3
import argparse
import sys
import re
import os
import time


def get_athena_client():
    if "EXTAGENT_ACCESS" in os.environ:
        sts_client = boto3.client(
            "sts",
            aws_access_key_id=os.getenv("EXTAGENT_ACCESS"),
            aws_secret_access_key=os.getenv("EXTAGENT_SECRET"),
            region_name="us-east-1",
        )

        role = sts_client.assume_role(
            RoleArn="arn:aws:iam::530459586293:role/CausalSandboxWarehouse",
            RoleSessionName="sandbox-warehouse-cron",
        )

        credentials = role["Credentials"]
        aws_access_key_id = credentials["AccessKeyId"]
        aws_secret_access_key = credentials["SecretAccessKey"]
        aws_session_token = credentials["SessionToken"]

        return boto3.client(
            "athena",
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            aws_session_token=aws_session_token,
            region_name="us-east-1",
        )
    else:
        return boto3.client("athena")


def get_iam_client():
    return boto3.client("iam")


def get_redshift_data_client():
    return boto3.client("redshift-data")


def execute_redshift_statement(
    sql,
    statement_name,
    redshift_cluster_identifier,
    redshift_database,
    redshift_secret_arn,
    redshift_client,
):
    try:
        response = redshift_client.execute_statement(
            Sql=sql,
            StatementName=statement_name,
            ClusterIdentifier=redshift_cluster_identifier,
            Database=redshift_database,
            SecretArn=redshift_secret_arn,
        )
        print("Redshift Execution ID: " + response["Id"])
        return response
    except redshift_client.exceptions.ValidationException as e:
        print(
            f"Could not create Redshift Spectrum external schema because statement could not be validated",
            file=sys.stderr,
        )
        print(e, file=sys.stderr)
        exit(1)
    except redshift_client.exceptions.ExecuteStatementException as e:
        print(
            f"Could not create Redshift Spectrum external schema because there was a problem during statement execution",
            file=sys.stderr,
        )
        print(e, file=sys.stderr)
        exit(1)
    except redshift_client.exceptions.ActiveStatementsExceededException as e:
        print(
            f"Could not create Redshift Spectrum external schema because there were too many active statements when trying to execute statement",
            file=sys.stderr,
        )
        print(e, file=sys.stderr)
        exit(1)


def run_query(query, database, s3_output, client):

    response = client.start_query_execution(
        QueryString=query,
        QueryExecutionContext={"Database": database},
        ResultConfiguration={
            "OutputLocation": s3_output,
        },
    )

    print("Athena Execution ID: " + response["QueryExecutionId"])
    return response


def find_s3_root(filename):
    pattern = re.compile("'(s3://.*/)tables/.*';")

    for line in open(filename):
        for match in re.finditer(pattern, line):
            return match.group(1)
    return None


if __name__ == "__main__":

    client = get_athena_client()

    parser = argparse.ArgumentParser(
        description="Executes Causal SQL statements to create tables in a database"
    )
    parser.add_argument("sql_file", type=str, help="The sql file")
    parser.add_argument(
        "--output-location",
        nargs="?",
        type=str,
        default=None,
        help="The query results output location (defaults to s3://<s3-bucket>/ddlexecution) ",
    )
    parser.add_argument(
        "--database",
        type=str,
        nargs="?",
        default="default",
        help='The database name (defaults to "default")',
    )
    parser.add_argument(
        "--create",
        action="store_true",
        help="Create the database if it does not already exist",
    )
    parser.add_argument(
        "--pretend", action="store_true", help="Show statements that would be executed"
    )
    parser.add_argument(
        "--redshift-cluster-identifier",
        dest="redshift_cluster_identifier",
        type=str,
        help="""The Amazon Redshift cluster you use to run queries.
        The cluster must be in the same region as your S3 bucket. 
        If supplied, creates an external schema in Redshift Spectrum you can use for queries backed by the AWS Glue catalog.
        The AWS Glue Catalog is populated when this script executes all of it's Athena queries
        """,
        default=None,
        required=False,
    )
    parser.add_argument(
        "--redshift-role-name",
        dest="redshift_role_name",
        type=str,
        help="The role (name) you use to provision access to your Amazon Redshift cluster.",
        required=False,
    )
    parser.add_argument(
        "--redshift-database",
        dest="redshift_database",
        type=str,
        help="The redshift database name you want to associate the external schema with.",
        default="dev",
        required=False,
    )
    parser.add_argument(
        "--redshift-secret-arn",
        dest="redshift_secret_arn",
        type=str,
        help="The AWS Secrets Manager secret you use to store your Amazon Redshift database credentials",
        default="dev",
        required=False,
    )
    parser.add_argument(
        "--glue-data-catalog-region",
        dest="glue_data_catalog_region",
        type=str,
        default=None,
        help="The AWS region that the Glue data catalog database resides in",
    )

    #

    args = parser.parse_args()

    s3_base = find_s3_root(args.sql_file)
    if s3_base == None:
        print("could not find s3 root in sql file", file=sys.stderr)
        exit()

    if args.output_location == None:
        output_location = find_s3_root(args.sql_file) + "ddlexecution"
    else:
        output_location = args.output_location

    print(
        f"Building warehouse:\n  SQL file={args.sql_file}\n  database={args.database}\n  create database={args.create}"
    )
    print(
        f"  S3 base in SQL file={s3_base}\n  DDL result output location={output_location}\n  Pretend={args.pretend}"
    )

    if args.create:
        query = f"CREATE DATABASE IF NOT EXISTS {args.database};"
        if args.pretend:
            print(query)
        else:
            response = client.start_query_execution(
                QueryString=query,
                ResultConfiguration={
                    "OutputLocation": output_location,
                },
            )
            print("Athena Execution ID: " + response["QueryExecutionId"])

    # Athena can only process one statement at a time. Causal outputs the
    # ---- separator between statements
    ddl = open(args.sql_file).read().split("----")
    for stmt in ddl:
        if len(stmt) == 0 or stmt.isspace():
            continue
        if args.pretend:
            print(stmt)
        else:
            run_query(stmt, args.database, output_location, client)
        time.sleep(2)

    ## Setup Redshift Spectrum schmea
    if args.redshift_cluster_identifier is not None:
        redshift_role_name = args.redshift_role_name
        iam = get_iam_client()
        try:
            response = get_iam_client().get_role(RoleName=redshift_role_name)
        except iam.exceptions.NoSuchEntityException as e:
            print(
                f"Could not create Redshift Spectrum external schema because {redshift_role_name} does not correspond to a role in this AWS account",
                file=sys.stderr,
            )
            print(e, file=sys.stderr)
            exit(1)

        cluster_role_arn = response["Role"]["Arn"]
        redshift_cluster_identifier = args.redshift_cluster_identifier
        catalog_database = args.database
        redshift_datatbase = args.redshift_database
        redshift_secret_arn = args.redshift_secret_arn
        glue_data_catalog_region = args.glue_data_catalog_region
        sql = f"create external schema {catalog_database} from data catalog database '{catalog_database}' iam_role '{cluster_role_arn}' region '{glue_data_catalog_region}' create external database if not exists;"

        if args.pretend:
            print(sql)
        else:
            redshift_data = get_redshift_data_client()
            execute_redshift_statement(
                sql=sql,
                statement_name="CausalCreateExternalSchema",
                redshift_cluster_identifier=redshift_cluster_identifier,
                redshift_database=redshift_datatbase,
                redshift_secret_arn=redshift_secret_arn,
                redshift_client=redshift_data,
            )
