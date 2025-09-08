!macro preInit
  StrCpy $INSTDIR "$LOCALAPPDATA\Programs\R5Valkyrie Launcher"
!macroend

!macro customInstall
  CreateDirectory "$INSTDIR"
!macroend