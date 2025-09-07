!macro preInit
  ; Set default install directory
  StrCpy $INSTDIR "$PROGRAMFILES64\R5Valkyrie\R5Valk Launcher"
!macroend

!macro customInstall
  ; Ensure base directories exist
  CreateDirectory "$PROGRAMFILES64\R5Valkyrie"
  CreateDirectory "$INSTDIR"
  CreateDirectory "$PROGRAMFILES64\R5Valkyrie\R5Valk Library"

  ; Grant Users full control on the app and library folders
  ; Requires elevation (perMachine install)
  nsExec::ExecToLog 'icacls "$PROGRAMFILES64\R5Valkyrie" /grant Users:(OI)(CI)F /T /C'
  nsExec::ExecToLog 'icacls "$INSTDIR" /grant Users:(OI)(CI)F /T /C'
  nsExec::ExecToLog 'icacls "$PROGRAMFILES64\R5Valkyrie\R5Valk Library" /grant Users:(OI)(CI)F /T /C'
!macroend


