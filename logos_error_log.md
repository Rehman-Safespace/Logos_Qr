# Logos Engine - Historical Error Log

## Known Errors & Resolutions

### 1. Image Generation Quota Limit
- **Timestamp**: 2026-05-24
- **Component**: System Image Generator (Tool)
- **Error**: `generic::resource_exhausted: You exceeded your current quota`
- **Impact**: Unable to generate the requested "cybernetic dreamcatcher Arabesque glowing logo".
- **Resolution/Status**: This is a hard limit from the Google API quota for the underlying image generation model. Awaiting quota reset or billing upgrade for image generation capabilities. The rest of the engine operational modes remain fully functional.

### 2. Speech Recognition (Web Speech API) Limit/Support
- **Component**: Frontend Client / `src/App.tsx`
- **Error/Limitation**: `(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition` is undefined in some browsers or embedded iFrames.
- **Impact**: Voice interaction button might show a browser not supported alert.
- **Resolution**: Added the `alert()` fallback for unsupported browsers. Ensured users can easily toggle `ar-SA` and `en-US` via the UI.

### 3. Shell Command Restrictions
- **Component**: Agent / CLI
- **Error**: Agent attempted to use `cat` and `ls` commands which are not permitted.
- **Resolution**: Adhered to standard sandbox tooling (`view_file`, `list_dir`, `grep`).
