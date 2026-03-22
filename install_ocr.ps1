$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "Iniciando processo de download e descompactação do OCR para o Miriam Editor..."

$tessUrl = "https://digi.bib.uni-mannheim.de/tesseract/tesseract-ocr-w64-setup-5.3.3.20231005.exe"
$tessExe = "$env:TEMP\tesseract-setup.exe"
Write-Host "Baixando Tesseract v5.3..."
Invoke-WebRequest -Uri $tessUrl -OutFile $tessExe

Write-Host "Instalando Tesseract silenciosamente (Pode aparecer aviso de Administrador na tela)..."
Start-Process -FilePath $tessExe -ArgumentList "/SILENT" -Wait

Write-Host "Tesseract instalado."

$popplerUrl = "https://github.com/oschwartz10612/poppler-windows/releases/download/v24.02.0-0/Release-24.02.0-0.zip"
$popplerZip = "$env:TEMP\poppler.zip"
$popplerDest = "C:\poppler"

if (!(Test-Path $popplerDest)) { 
    New-Item -ItemType Directory -Force -Path $popplerDest 
}

Write-Host "Baixando Poppler..."
Invoke-WebRequest -Uri $popplerUrl -OutFile $popplerZip

Write-Host "Extraindo Poppler zip file..."
Expand-Archive -LiteralPath $popplerZip -DestinationPath $popplerDest -Force

Write-Host "Concluido! Os binarios do Poppler estao em C:\poppler"
