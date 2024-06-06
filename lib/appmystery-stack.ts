import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export class AppmysteryStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create VPC
    const vpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: 'PublicSubnet',
          cidrMask: 24,
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          name: 'PrivateSubnet',
          cidrMask: 24,
        },
      ],
    });

    // Create ECS Cluster
    const cluster = new ecs.Cluster(this, 'MyCluster', {
      vpc,
    });

    // Create ECR Repository
    const repository = new ecr.Repository(this, 'MyRepository');

    // Deploy a sample ECR image to ECS tasks
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'MyTaskDefinition', {
      memoryLimitMiB: 512, // 0.5 GB
      cpu: 256, // 0.25 vCPU
    });

    const container = taskDefinition.addContainer('MyContainer', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      memoryLimitMiB: 512,
    });

    // Add port mappings to the container
    container.addPortMappings({
      containerPort: 8080, // Example port, change if necessary
    });

    // Create ECS Service
    const service = new ecs.FargateService(this, 'MyService', {
      cluster,
      taskDefinition,
      desiredCount: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Create ALB
    const alb = new elbv2.ApplicationLoadBalancer(this, 'MyALB', {
      vpc,
      internetFacing: true,
    });

    // Create Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'MyTargetGroup', {
      port: 8080,
      vpc,
      targetType: elbv2.TargetType.IP,
    });

    // Add Targets
    targetGroup.addTarget(service);

    // Create Listener
    alb.addListener('Listener', {
      port: 8080,
      defaultTargetGroups: [targetGroup],
    });

    // Output the ALB DNS Name
    new cdk.CfnOutput(this, 'ALBDNSName', {
      value: alb.loadBalancerDnsName,
    });
  }
}
