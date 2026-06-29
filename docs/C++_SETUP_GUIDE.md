# C++ Setup Guide

This guide explains how to install g++ (C++ compiler) for the C++ code submission feature.

## Installation

Open PowerShell or Command Prompt and run:

```bash
winget install GCC.MinGW
```

## Verify Installation

After installation, verify the compiler is installed:

```bash
g++ --version
```

You should see output like:
```
g++ (MinGW-W64 x86_64) 13.x.x
```

## Restart Backend After Installation

After installing g++, **you must restart the backend server** for the changes to take effect.

### If running via Node.js:
1. Stop the current server (Ctrl+C)
2. Restart the server: `node src/server.js` or equivalent

### If running in an IDE:
Simply restart the application.

## Troubleshooting

- If `g++ --version` is not recognized after install, try restarting your terminal or IDE
- Ensure MinGW is in your system PATH
- On Windows, you may need to run the installer as Administrator
