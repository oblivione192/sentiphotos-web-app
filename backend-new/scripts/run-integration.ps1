Param(
  [string]$Region,
  [string]$Bucket,
  [string]$AccessKeyId,
  [string]$SecretAccessKey
)

# Load defaults from .env.example if present
$defaults = @{}
$envFile = Join-Path -Path (Get-Location) -ChildPath '.env.example'
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -and -not $_.Trim().StartsWith('#') -and $_ -match '^(?<k>[^=]+)=(?<v>.*)$') {
      $k = $matches['k'].Trim()
      $v = $matches['v'].Trim().Trim('"').Trim("'")
      $defaults[$k] = $v
    }
  }
}

# Prompt for values if not provided, using .env.example defaults when available
if (-not $Region) { $Region = $defaults['AWS_REGION'] -or (Read-Host "AWS Region (e.g. us-east-1) [${defaults['AWS_REGION']}]") }
if (-not $Bucket) { $Bucket = $defaults['AWS_BUCKET_NAME'] -or (Read-Host "AWS Bucket name [${defaults['AWS_BUCKET_NAME']}]") }
if (-not $AccessKeyId) { $AccessKeyId = $defaults['AWS_ACCESS_KEY_ID'] -or (Read-Host "AWS Access Key ID (leave blank to use environment/role) [${defaults['AWS_ACCESS_KEY_ID']}]") }
if (-not $SecretAccessKey -and $AccessKeyId) { 
  $secure = Read-Host "AWS Secret Access Key (input hidden)" -AsSecureString
  $SecretAccessKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

# Set environment variables for this session
$env:AWS_REGION = $Region
$env:AWS_BUCKET_NAME = $Bucket
if ($AccessKeyId) {
  $env:AWS_ACCESS_KEY_ID = $AccessKeyId
  $env:AWS_SECRET_ACCESS_KEY = $SecretAccessKey
}
$env:RUN_AWS_S3_INTEGRATION = 'true'

Write-Host "Running S3 integration tests against bucket '$Bucket' in region '$Region'..."

# Run the integration tests
npm run test:integration
