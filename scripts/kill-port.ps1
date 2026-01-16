# Script to kill process on port 5241
$port = 5241
$connections = netstat -ano | findstr ":$port"

if ($connections) {
    $processes = $connections | ForEach-Object {
        if ($_ -match '\s+(\d+)\s*$') {
            $matches[1]
        }
    } | Select-Object -Unique
    
    foreach ($pid in $processes) {
        if ($pid -and $pid -ne "0") {
            Write-Host "Killing process $pid on port $port..."
            taskkill /PID $pid /F 2>$null
            Start-Sleep -Milliseconds 500
        }
    }
    Write-Host "Port $port is now free."
} else {
    Write-Host "Port $port is already free."
}
