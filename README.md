# DevOps learning project

This starter project is a small static website with automated tests and optional AWS deployment. It uses GitHub Actions, Terraform, a private S3 bucket, and CloudFront. The bucket is not public; CloudFront gets read access through Origin Access Control. Terraform is configured to empty this dedicated bucket when you destroy the project infrastructure.

## What you will learn

- **Git and GitHub:** commit a change and open a pull request.
- **CI:** GitHub Actions runs the tests for every pull request.
- **Infrastructure as Code:** Terraform describes the AWS resources.
- **CD:** after a tested change reaches `main`, GitHub Actions uploads the site and clears the CloudFront cache.
- **Cloud fundamentals:** S3 stores the files, and CloudFront serves them over HTTPS.

## 1. Run it locally

Install Node.js 22 or later. From this folder, run:

```powershell
npm test
```

To preview the site, open `site/index.html` in a browser. Change the page text, run the tests again, and keep the change if they pass.

## 2. Put the project in GitHub

Create a new, empty GitHub repository. In this folder, initialize Git, add the files, and push them to a branch named `main`:

```powershell
git init
git add .
git commit -m "Create DevOps learning project"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/YOUR_REPOSITORY.git
git push -u origin main
```

The test job runs on pull requests and pushes. The deploy job runs only after a push to `main` or a manual run, and only after tests pass. Deployment needs the AWS setup below.

## 3. Create the AWS infrastructure

> **Cost and cleanup:** This creates an S3 bucket and a CloudFront distribution, which may incur AWS charges. Check current AWS pricing, use a learning account, and delete the resources when you finish. Nothing is created until you run `terraform apply`.

Install Terraform and the AWS CLI. Sign in locally with an AWS identity that is allowed to create the listed S3 and CloudFront resources; AWS IAM Identity Center (SSO) is preferable to long-lived access keys. Then:

```powershell
aws configure sso
aws sso login --profile YOUR_PROFILE
$env:AWS_PROFILE = "YOUR_PROFILE"
Copy-Item infra/terraform.tfvars.example infra/terraform.tfvars
```

Edit `infra/terraform.tfvars` and replace the example bucket name with a globally unique name. In the `infra` folder, run:

```powershell
Set-Location infra
terraform init
terraform plan
terraform apply
terraform output
Set-Location ..
```

Review the plan before confirming `apply`. Terraform creates a private S3 bucket and a CloudFront distribution with HTTPS. The first CloudFront deployment can take several minutes.

## 4. Set up GitHub Actions deployment

Use GitHub's OpenID Connect (OIDC) integration so Actions can get short-lived AWS credentials instead of storing AWS access keys:

1. In AWS IAM, add the GitHub OIDC identity provider if your account does not already have it. Its provider URL is `https://token.actions.githubusercontent.com` and its audience is `sts.amazonaws.com`.
2. Create an IAM role trusted by that provider. Restrict its trust policy to the audience `sts.amazonaws.com` and the subject `repo:YOUR_NAME/YOUR_REPOSITORY:ref:refs/heads/main`. This limits assumption of the role to this repository's `main` branch.
3. Give the role only the permissions needed to deploy: `s3:ListBucket` and `s3:GetBucketLocation` on your site's bucket; `s3:PutObject` and `s3:DeleteObject` on that bucket's objects; and `cloudfront:CreateInvalidation` on your distribution. Replace the resource ARNs with the exact bucket and distribution ARNs. Avoid `Resource: "*"`.
4. In the GitHub repository, add the role ARN as the `AWS_ROLE_ARN` Actions secret. Add `AWS_REGION`, `S3_BUCKET`, and `CLOUDFRONT_DISTRIBUTION_ID` as Actions variables. Use the region and values printed by `terraform output` (the distribution ID is also an output).
5. Push a change to `main`. Check the **Actions** tab, then open the `site_url` Terraform output.

The workflow tests pull requests but never deploys them. The IAM trust condition should continue to restrict deployments to `main`.

## 5. Practice and clean up

Try changing the heading, opening a pull request, and watching the test job. Merge it, observe the deployment, and inspect the Actions logs. Then run `terraform destroy` from the `infra` folder and review the plan before confirming. Remove the GitHub role and OIDC provider only if you created them just for this project and no other workflows use them.

## Suggested learning sequence

1. **First:** practice Git, read the workflow, and make the tests pass.
2. **Next:** learn the Terraform plan/apply/destroy cycle and understand each AWS resource.
3. **Then:** experiment with a rollback by reverting a site change and deploying again.
4. **After this project:** containerize a small app with Docker, then learn how to run it on AWS. This keeps your first deployment focused on the fundamentals.
