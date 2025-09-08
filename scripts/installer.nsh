!macro preInit
  StrCpy $INSTDIR "$LOCALAPPDATA\Programs\R5Valkyrie Launcher"
!macroend

!macro customInstall
  CreateDirectory "$INSTDIR"
!macroend

!macro customUnInstall
  ; Keep $INSTDIR\Releases, remove everything else
  FindFirst $0 $1 "$INSTDIR\*.*"
  loop_items:
    StrCmp $1 "" done
    StrCmp $1 "." next
    StrCmp $1 ".." next
    StrCmp $1 "Releases" next
    RMDir /r "$INSTDIR\$1"
  next:
    FindNext $0 $1
    Goto loop_items
  done:
  FindClose $0
  ; Note: electron-builder may try RMDir $INSTDIR afterwards.
  ; Since Releases remains, $INSTDIR removal will fail silently and be left intact.
!macroend