import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';

export class APPMYSTERYStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'MyCluster', {
      vpc,
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    // Container Definition
    const container = taskDefinition.addContainer('sample-container', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'sample-container' }),
    });

    container.addPortMappings({
      containerPort: 8080,
    });

    // ECS Service with Application Load Balancer
    const ecsService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'MyFargateService', {
      cluster,
      taskDefinition,
      publicLoadBalancer: true,
    });

    // Allow inbound traffic to ECS tasks on port 8080
    ecsService.targetGroup.configureHealthCheck({
      path: "/",
      port: "8080"
    });

    // Output the ALB DNS
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: ecsService.loadBalancer.loadBalancerDnsName,
    });
  }
}


