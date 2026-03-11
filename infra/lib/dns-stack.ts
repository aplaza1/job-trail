import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';

interface DnsStackProps extends cdk.StackProps {
  hostedZone: route53.IHostedZone;
  distribution: cloudfront.Distribution;
}

export class DnsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, props);

    const { hostedZone, distribution } = props;

    new route53.ARecord(this, 'ApexARecord', {
      zone: hostedZone,
      recordName: 'jobtrail.dev',
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
    });

    new route53.AaaaRecord(this, 'ApexAaaaRecord', {
      zone: hostedZone,
      recordName: 'jobtrail.dev',
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
    });

    new route53.CnameRecord(this, 'WwwCnameRecord', {
      zone: hostedZone,
      recordName: 'www',
      domainName: distribution.distributionDomainName,
    });
  }
}
