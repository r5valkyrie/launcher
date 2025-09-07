!macro preInit
  StrCpy $INSTDIR "$PROGRAMFILES64\R5 Valkyrie Launcher"
!macroend

!macro customInstall
  CreateDirectory "$INSTDIR"
  nsExec::ExecToLog 'icacls "$INSTDIR" /grant Users:(OI)(CI)F /T /C'
!macroend


