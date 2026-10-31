# DevOps notes: beginner reference

These notes are a learning companion, not an exhaustive manual. Try commands in a disposable local environment or AWS learning account, and check official documentation before using them in production.

## 1. What DevOps means

DevOps is a way for development and operations teams to work together to deliver software reliably. It combines culture, practices, and tools; it is not one product or job title.

Common goals:

- Deliver small changes frequently.
- Automate repeatable work and test changes early.
- Make systems observable so problems are easier to find.
- Reduce risk with reviews, staged rollouts, and rollback plans.
- Learn from incidents and improve the system rather than blame people.

A typical delivery loop is **plan → code → build → test → release → deploy → operate → observe → improve**. CI/CD, infrastructure as code, containers, and monitoring support this loop.

## 2. Linux and the command line

Linux servers are commonly managed through a shell. Start by understanding the current directory, paths, files, processes, permissions, and command output.

| Task | Command |
|---|---|
| Print current directory | `pwd` |
| List files, including hidden files | `ls -la` |
| Change directory | `cd path/to/folder` |
| Show a file | `cat file.txt` |
| Search text | `grep -R "text" .` |
| Find files | `find . -name "*.log"` |
| Show running processes | `ps aux` |
| Show disk space | `df -h` |
| Show memory | `free -h` |
| Show listening sockets | `ss -tulpn` |
| View recent service logs | `journalctl -u SERVICE --since "1 hour ago"` |

Useful ideas:

- An absolute path starts at `/`; a relative path starts from the current directory.
- Standard input, standard output, and standard error are streams. `>` redirects output, `>>` appends output, and `|` passes output to another command.
- Exit code `0` usually means success; a non-zero code usually signals failure. Check it before assuming a command worked.
- Use `sudo` only when elevated privileges are needed. Understand a command before running it as an administrator.
- File permissions are commonly shown as read (`r`), write (`w`), and execute (`x`) for owner, group, and others. Avoid making sensitive files world-readable.

On Windows, PowerShell uses different command names and path conventions. For example, `Get-ChildItem` lists files and paths commonly use `\`. WSL provides a Linux shell on Windows if you want to practice Linux commands.

## 3. Networking essentials

- **IP address:** identifies a network interface. Private IPv4 ranges commonly include `10.0.0.0/8`, `172.16.0.0/12`, and `192.168.0.0/16`.
- **Subnet/CIDR:** describes an address range. For example, `10.0.1.0/24` contains 256 IPv4 addresses, including network and reserved addresses.
- **DNS:** maps names such as `example.com` to IP addresses.
- **TCP:** reliable, ordered connections; commonly used by HTTP(S), SSH, and databases.
- **UDP:** datagrams without the same connection guarantees; often used for DNS and real-time traffic.
- **HTTP/HTTPS:** web protocols; HTTPS adds TLS encryption and server identity verification.
- **Port:** identifies a service on a host. Common examples: SSH 22, HTTP 80, HTTPS 443.
- **TLS certificate:** helps authenticate a server and encrypt traffic. ACM can manage certificates for supported AWS services.

Troubleshooting sequence:

1. Is the service running and listening on the expected port?
2. Does DNS resolve to the expected address?
3. Do routing and firewall/security-group rules allow the traffic?
4. Can a client connect (`curl -I https://example.com`, `nslookup example.com`, `ping HOST` where ICMP is allowed)?
5. Do application logs show a request or error?

Security groups are stateful virtual firewalls attached to AWS resources. Permit only the sources and ports the application needs. Do not expose SSH or databases to the whole internet for convenience.

## 4. Git and GitHub

Git records changes. GitHub hosts Git repositories and adds collaboration features such as pull requests and Actions.

```bash
git status
git add path/to/file
git commit -m "Describe the change"
git log --oneline
git switch -c feature/my-change
git push -u origin feature/my-change
```

Typical collaboration flow:

1. Create a branch for one change.
2. Edit and test locally.
3. Review `git diff` and `git status`.
4. Commit, push, and open a pull request.
5. Let automated checks run; review the change; merge when approved.

Useful terms:

- **Working tree:** files currently being edited.
- **Commit:** saved snapshot with a message and parent commit.
- **Branch:** movable name referring to a line of commits.
- **Merge:** combine changes from another branch.
- **Pull request:** proposal and review process for merging changes.
- **`.gitignore`:** patterns for files Git should not track (for example state files, build output, and secrets).

Never commit passwords, access keys, private certificates, or Terraform state. If a secret is committed, removing it in a later commit is not enough: revoke/rotate the secret immediately and follow your hosting provider's secret-removal guidance.

## 5. Scripting and automation

Automation makes repetitive work consistent, but it can also repeat mistakes quickly. Begin with small scripts that check inputs, report failures, and are safe to run more than once.

- Use Bash for shell automation on Linux and CI runners; use PowerShell naturally on Windows.
- Use Python for more involved automation, APIs, data processing, and cloud SDK tasks.
- Quote paths and variables, check command exit codes, and avoid embedding credentials in scripts.
- Prefer declarative configuration for desired system state; use scripts for glue and one-off tasks.
- Make automation **idempotent** where practical: running it again should converge on the intended result rather than create duplicates or damage.

## 6. Containers and Docker

A container packages an application and its runtime dependencies. It shares the host kernel; it is not a full virtual machine.

- **Image:** immutable template used to create containers.
- **Container:** running instance of an image.
- **Registry:** service that stores and distributes images.
- **Volume:** persistent or shared data mounted into a container.
- **Port mapping:** connects a host port to a container port.

Common commands:

```bash
docker build -t my-app:local .
docker image ls
docker run --rm -p 8080:80 my-app:local
docker ps
docker logs CONTAINER
docker stop CONTAINER
```

Good habits:

- Use a small, maintained base image and pin versions intentionally.
- Run as a non-root user when possible.
- Do not bake secrets into an image or its build arguments.
- Add a `.dockerignore` so local files and secrets are not sent to builds.
- Rebuild images regularly to receive base-image security updates.
- Store persistent data outside the container's writable layer.

## 7. CI/CD and GitHub Actions

- **Continuous Integration (CI):** automatically build and test each proposed change.
- **Continuous Delivery:** keep changes releasable, with production release usually requiring approval.
- **Continuous Deployment:** automatically release every qualifying change to production.

This project's workflow runs tests on pull requests and pushes to `main`. Its AWS deploy job is intended to run only on `main` after tests and after AWS settings are configured.

Typical pipeline:

1. Check out source.
2. Install pinned tool versions/dependencies.
3. Run formatting, tests, and security checks.
4. Build a deployable artifact or container image.
5. Publish the artifact.
6. Deploy to a test/staging environment, verify health, then release safely.

For CI security:

- Give each workflow only the permissions it needs.
- Pin third-party actions to reviewed versions; higher-assurance environments may pin full commit SHAs.
- Do not run untrusted pull-request code with production credentials.
- Use GitHub OIDC for short-lived AWS credentials rather than long-lived AWS access keys.
- Protect the production branch and review workflow-file changes carefully.

## 8. Infrastructure as Code with Terraform

Infrastructure as Code (IaC) defines infrastructure in version-controlled files so it can be reviewed and reproduced. Terraform describes desired resources and compares them with its state and the actual provider environment.

Core workflow:

```bash
terraform fmt -check
terraform init
terraform validate
terraform plan
terraform apply
terraform output
```

Before `apply`, read the plan and confirm the account, region, resource changes, and cost implications. `terraform destroy` removes resources managed by the configuration; inspect its plan and confirm the target environment first.

Important concepts:

- **Provider:** integration with AWS or another platform.
- **Resource:** infrastructure Terraform manages.
- **Variable:** input to a configuration.
- **Output:** useful value returned by a configuration.
- **State:** mapping between Terraform configuration and real resources. Treat it as sensitive; it can contain secrets. Use protected remote state with locking for shared/production work.
- **Module:** reusable Terraform configuration.

Do not commit `terraform.tfstate`, state backups, or real `.tfvars` containing sensitive values. `.gitignore` is helpful but does not replace checking `git status` before committing.

## 9. AWS foundations for this project

- **EC2:** virtual servers; you manage the operating system and application runtime.
- **S3:** object storage for files. This project uses a private bucket for site assets.
- **CloudFront:** content delivery network. It serves the website over HTTPS and accesses the private bucket using Origin Access Control.
- **ACM:** certificate management for supported AWS services. This starter uses CloudFront's default domain certificate; a custom domain and ACM certificate are an optional next step.
- **IAM:** identities and permissions. Grant only necessary actions on exact resources.
- **CloudWatch:** metrics, logs, alarms, and operational dashboards.
- **VPC:** logically isolated AWS network containing subnets, routes, and network controls.

AWS safety checklist:

1. Use a dedicated learning account or isolated environment and enable MFA.
2. Prefer IAM Identity Center/SSO for local access; do not use root credentials for daily work.
3. Set a budget alert and review the current prices before creating resources. Alerts are not a spending cap.
4. Keep S3 public access blocked unless a reviewed design specifically requires otherwise.
5. Restrict security-group ingress; never expose management ports to `0.0.0.0/0` unnecessarily.
6. Give GitHub Actions a narrowly scoped IAM role trusted only by the expected repository and branch.
7. Remove resources when done and verify the account afterward. CloudFront distributions can take time to delete.

The Terraform example can create billable resources. Running `terraform plan` is not the same as applying, but `terraform apply` creates resources. Its S3 bucket is configured to be emptied on `terraform destroy`; use it only as a dedicated learning bucket and never store important data there.

## 10. Monitoring, logging, and reliability

- **Metrics** are numeric measurements over time (CPU, request count, latency).
- **Logs** are timestamped event records. Include useful context, but do not log passwords, tokens, or personal data unnecessarily.
- **Traces** follow a request across multiple services.
- **Alert** when a user-impacting symptom or actionable risk crosses a threshold; avoid noisy alerts nobody can act on.
- **Health check** reports whether a service can serve traffic. A useful readiness check verifies required dependencies without exposing sensitive details.

Reliability practices:

- Define service-level indicators (SLIs), such as availability and latency; use service-level objectives (SLOs) to set target reliability.
- Make backups and periodically test restore procedures.
- Design graceful timeouts, retries with limits/backoff, and idempotent operations.
- Deploy gradually when possible, monitor the result, and keep a rollback path.
- During an incident, communicate clearly, mitigate user impact, preserve evidence, and write a blameless review with specific follow-up actions.

## 11. Security basics

- Keep software and base images patched.
- Use least privilege for people, services, and workflows.
- Store secrets in a managed secret store or CI secret facility; rotate them and restrict access.
- Use HTTPS for traffic and encryption at rest where appropriate.
- Validate inputs and avoid logging sensitive information.
- Scan dependencies and container images; investigate and update vulnerable components.
- Back up important data and test recovery.
- Separate development, test, and production accounts/environments.
- Review changes that affect IAM, networking, encryption, or deployment automation.

Security is an ongoing process, not a one-time checklist or a guarantee that a system is safe.

## 12. Suggested hands-on sequence

1. Make a small site change and use Git branches and pull requests.
2. Inspect the Actions workflow and confirm tests pass on a pull request.
3. Learn Linux, DNS, HTTP, ports, and security groups before troubleshooting a deployment.
4. Install Terraform, inspect the infrastructure, run `fmt`, `validate`, and `plan`; apply only after checking AWS budget and plan.
5. Configure OIDC and least-privilege IAM by following the project README; do not add static AWS keys to GitHub.
6. Deploy, review the Actions logs and CloudWatch signals, then practice a rollback.
7. Destroy the learning infrastructure and verify that the dedicated resources are gone.
8. Learn Docker and containerize a small app before moving on to Kubernetes.

## Glossary

| Term | Meaning |
|---|---|
| Artifact | Built output passed between pipeline stages |
| Availability | Proportion of time a service is usable |
| Deployment | Installing a version into an environment |
| Drift | Difference between declared infrastructure and actual infrastructure |
| IaC | Infrastructure as Code |
| Idempotent | Repeating an operation has the same intended end state |
| Least privilege | Grant only the permissions needed |
| Rollback | Return to a previously working version or configuration |
| Scalability | Ability to handle increased workload |
| Secret | Credential or sensitive value that must be protected |
