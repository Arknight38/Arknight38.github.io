export const wdfilterdrv = {
  id: 'wdfilterdrv',
  title: 'WdFilterDrv: Kernel-Mode Driver Development',
  subtitle: 'Building a Windows kernel-mode driver to understand OS internals at the lowest level.',
  date: '2024',
  categories: ['systems', 'closed', 'security'],
  tags: ['kernel', 'driver', 'c++', 'windows'],
  readTime: '14 min',
  featured: true,
  content: `## Overview

WdFilterDrv is a Windows kernel-mode driver built to understand how the operating system works at the lowest level. This is an **educational and research project** that explores kernel-mode driver development, cross-process memory operations, manual PE module mapping, shared memory communication, and HID input injection.

**Note: This project is incomplete and under active development.** Many features are implemented but may require additional testing, refinement, or are still in progress. The code should be considered experimental and used for educational purposes only.

## Why Kernel Development?

Kernel-mode code runs with the highest privileges (Ring 0), allowing:

- Direct hardware access
- Memory management control
- Process/thread manipulation
- System-wide hooking

This power comes with responsibility — bugs here crash the entire system.

## Build Process

### Prerequisites

- Windows Driver Kit (WDK) - Compatible with Visual Studio 2019/2022
- Windows SDK
- Test signing enabled (for development)

### Building the Driver

1. Open the Visual Studio solution in the \`WdFilterDrv/\` directory
2. Select the appropriate configuration (Debug/Release) and platform (x64)
3. Build the solution
4. The driver binary (.sys) will be output to the build directory

### Test Signing (Development Only)

To load unsigned drivers during development:

\`\`\`cmd
bcdedit /set testsigning on
bcdedit /set nointegritychecks on
\`\`\`

Reboot after running these commands. Remember to disable test signing before production use.

## Usage

### Loading the Driver

Use a driver loading utility or sc.exe:

\`\`\`cmd
sc create WdFilterDrv type= kernel binPath= C:\\path\\to\\WdFilterDrv.sys
sc start WdFilterDrv
\`\`\`

### User-Mode Communication

The driver communicates with user-mode applications via:

1. **Device I/O Control (IOCTL)** - Send commands using DeviceIoControl API
2. **Shared Memory** - High-bandwidth data transfer via memory-mapped sections

### Example IOCTL Communication

\`\`\`c
HANDLE hDevice = CreateFile(L"\\\\\\\\.\\\\WdFilterDrv", ...);

// Read process memory
READ_MEMORY_REQUEST req = { .pid = target_pid, .address = addr, .size = size };
DeviceIoControl(hDevice, CMD_READ_MEMORY, &req, sizeof(req), buffer, size, &bytesReturned, NULL);

CloseHandle(hDevice);
\`\`\`

### Unloading the Driver

\`\`\`cmd
sc stop WdFilterDrv
sc delete WdFilterDrv
\`\`\`

## Architecture

### Driver Entry Point

\`\`\`c
NTSTATUS DriverEntry(PDRIVER_OBJECT DriverObject, PUNICODE_STRING RegistryPath) {
    // Register dispatch routines
    DriverObject->MajorFunction[IRP_MJ_CREATE] = DriverCreate;
    DriverObject->MajorFunction[IRP_MJ_CLOSE] = DriverClose;
    DriverObject->MajorFunction[IRP_MJ_DEVICE_CONTROL] = DriverIOCTL;
    
    // Create device for user-mode communication
    IoCreateDevice(...);
    return STATUS_SUCCESS;
}
\`\`\`

### Communication Interface

**Device I/O Control (IOCTL)**
User-mode applications send commands to the driver:

\`\`\`
User Mode                    Kernel Mode
    |                              |
    |-- DeviceIoControl --------->|-- Dispatch routine
    |    (IOCTL code)            |-- Validate params
    |    (input buffer)          |-- Execute operation
    |<-- return status ----------|-- Return results
    |    (output buffer)
\`\`\`

**Shared Memory Section**
For high-bandwidth data transfer:

- Create section object with ZwCreateSection
- Map into both user and kernel address spaces
- Synchronize access with kernel events

## Key Features

### Manual Module Mapping

Load PE files without using the Windows loader:

1. **Allocate memory**: ZwAllocateVirtualMemory
2. **Map sections**: Copy headers and section data
3. **Process relocations**: Adjust addresses for new base
4. **Resolve imports**: Walk import table, load dependencies
5. **Set permissions**: Apply section characteristics
6. **Execute entry point**: Call DllMain for DLLs

\`\`\`c
NTSTATUS ManualMap(PVOID peBuffer, ULONG size, PMAP_CONTEXT ctx) {
    // Parse PE headers
    PIMAGE_DOS_HEADER dos = (PIMAGE_DOS_HEADER)peBuffer;
    PIMAGE_NT_HEADERS nt = (PIMAGE_NT_HEADERS)((PUCHAR)peBuffer + dos->e_lfanew);
    
    // Allocate memory at preferred or random base
    PVOID base = AllocateImageBase(nt->OptionalHeader.SizeOfImage);
    
    // Copy PE headers
    memcpy(base, peBuffer, nt->OptionalHeader.SizeOfHeaders);
    
    // Copy sections
    PIMAGE_SECTION_HEADER section = IMAGE_FIRST_SECTION(nt);
    for (int i = 0; i < nt->FileHeader.NumberOfSections; i++) {
        PVOID dest = (PUCHAR)base + section[i].VirtualAddress;
        PVOID src = (PUCHAR)peBuffer + section[i].PointerToRawData;
        memcpy(dest, src, section[i].SizeOfRawData);
    }
    
    // Process relocations and imports...
    
    return STATUS_SUCCESS;
}
\`\`\`

### Process Memory Operations

Cross-process memory access using kernel APIs:

\`\`\`c
NTSTATUS ReadProcessMemory(HANDLE pid, PVOID address, PVOID buffer, SIZE_T size) {
    PEPROCESS process;
    PsLookupProcessByProcessId((HANDLE)pid, &process);
    
    KAPC_STATE apcState;
    KeStackAttachProcess(process, &apcState);
    
    // Now in target process context
    __try {
        memcpy(buffer, address, size);
    } __except (EXCEPTION_EXECUTE_HANDLER) {
        KeUnstackDetachProcess(&apcState);
        return STATUS_ACCESS_VIOLATION;
    }
    
    KeUnstackDetachProcess(&apcState);
    ObDereferenceObject(process);
    return STATUS_SUCCESS;
}
\`\`\`

### Synchronization

Kernel-level primitives for thread safety:

- **FastMutex**: Lightweight exclusion
- **ERESOURCE**: Shared/exclusive locking
- **Kernel Events**: Cross-process signaling
- **Spin Locks**: Interrupt-safe synchronization

## Debugging Techniques

### Kernel Debugging

Essential tools for driver development:

**WinDbg + Virtual Machine**
- Two-machine setup (host + VM target)
- Serial or network debugging connection
- Breakpoints in kernel code

**KDNET (Kernel Debug Network)**
Modern approach using network adapter:

\`\`\`
bcdedit /dbgsettings NET HOSTIP:192.168.1.10 PORT:50000
\`\`\`

**Local Kernel Debugging**
Limited but useful for inspection:

\`\`\`
bcdedit /debug on
// Use LiveKD or similar tools
\`\`\`

### Common Issues

**IRQL Issues**
- Code runs at wrong IRQL (Interrupt Request Level)
- Solution: Use proper locking, check IRQL assumptions

**Pool Corruption**
- Writing past allocated memory
- Solution: Driver Verifier with special pool

**Deadlocks**
- Holding locks while waiting for other resources
- Solution: Lock ordering, lock-free algorithms where possible

## Security Considerations

### Driver Signing

Windows requires driver signatures since Vista x64:

- **Test Mode**: Disable for development only
- **EV Certificate**: Extended Validation for production
- **WHQL**: Windows Hardware Quality Labs certification

### Attack Surface

Drivers are high-value targets:

- Validate all user input thoroughly
- Check buffer sizes and addresses
- Use ProbeForRead/Write for user buffers
- Never trust user-mode pointers

## What I Learned

Building a kernel driver taught me:
- Windows internals (object manager, memory manager, I/O system)
- x64 architecture details (paging, segments, system calls)
- Debugging techniques for Ring 0 code
- Security implications of kernel-level access
- The importance of defensive programming

Kernel development is challenging but deeply rewarding for understanding how operating systems truly work.`
};
