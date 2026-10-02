import Quickshell
import Quickshell.Io
import Quickshell.Wayland
import QtQuick
import qs.Commons
import qs.Ui
import "js/IrisEngine.js" as Engine
import "components/previews" as Previews

Item {
  id: root

  property string omarchyPath: Quickshell.env("OMARCHY_PATH")
  property var shell: null
  property var manifest: null

  property bool opened: false
  property string filterText: ""
  property int selectedIndex: 0
  property var itemsList: []
  property var selectedItem: itemsList.length > selectedIndex && selectedIndex >= 0 ? itemsList[selectedIndex] : null

  // Placeholder greeting rotation (Zero latency, in-memory)
  readonly property var placeholders: [
    "What do you want to do today?",
    "What would you like to do today?",
    "What would you like to do?",
    "What can I help you find or do?"
  ]
  property string currentPlaceholder: placeholders[0]

  function pickRandomPlaceholder() {
    if (!root.placeholders || root.placeholders.length === 0) return
    var available = root.placeholders.filter(function(p) { return p !== root.currentPlaceholder })
    var list = available.length > 0 ? available : root.placeholders
    root.currentPlaceholder = list[Math.floor(Math.random() * list.length)]
  }

  // Adaptive layout configuration
  readonly property bool hasPreview: root.selectedItem ? (root.selectedItem.hasPreview === true) : false
  readonly property int singlePaneWidth: panel && panel.width > 0
    ? Math.min(Style.space(640), Math.max(Style.space(320), panel.width - Style.space(48)))
    : Style.space(640)
  readonly property int twoPaneWidth: panel && panel.width > 0
    ? Math.min(Style.space(920), Math.max(Style.space(320), panel.width - Style.space(48)))
    : Style.space(920)

  readonly property int currentCardWidth: root.hasPreview ? root.twoPaneWidth : root.singlePaneWidth
  readonly property int maxCardHeight: panel && panel.height > 0
    ? Math.max(Style.space(260), Math.round(panel.height * 0.65))
    : Style.space(520)

  // Omarchy theme and styling tokens
  property color background: Color.menu.background
  property color foreground: Color.menu.text
  property color border: Color.menu.border
  property var borderSpec: Border.surfaceSpec("menu", "border", border, Math.max(1, Style.space(2)))
  property color scrim: Color.menu.scrim
  property color selectedBackground: Color.menu.selectedBackground
  property color selectedText: Color.menu.selectedText
  property color accent: Color.accent
  readonly property int cornerRadius: Style.cornerRadius
  property string fontFamily: Style.font.menuFamily

  property int contentMargin: Style.spacing.panelPadding
  property int contentSpacing: Style.spacing.md
  property int headerHeight: Math.max(Style.space(38), Style.font.title + Style.spacing.controlPaddingY * 2)
  property int rowHeight: Math.max(Style.space(44), Style.font.body + Style.space(18))

  readonly property var desktopApplications: DesktopEntries.applications.values || []
  property var fileResults: []
  property int searchGen: 0
  readonly property string homeDir: String(Quickshell.env("HOME") || "")

  Timer {
    id: fileSearchTimer
    interval: 40
    repeat: false
    onTriggered: root.executeFileSearch()
  }

  Process {
    id: fdProcess
    property int activeGen: 0
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: {
        if (fdProcess.activeGen === root.searchGen) {
          root.fileResults = Engine.parseFdOutput(String(text || ""), root.homeDir)
          root.refreshQuery()
        }
      }
    }
  }

  readonly property var pasteCommand: ["sh", "-c", "wl-paste --no-newline 2>/dev/null | head -c 4096"]
  readonly property var primaryPasteCommand: ["sh", "-c", "wl-paste --primary --no-newline 2>/dev/null | head -c 4096"]

  Process {
    id: pasteProcess
    command: root.pasteCommand
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: {
        var pasted = String(text || "").replace(/[\r\n]+/g, " ")
        if (pasted.length > 0) {
          root.filterText = (root.filterText + pasted).slice(0, 4096)
        }
      }
    }
  }

  Process {
    id: primaryPasteProcess
    command: root.primaryPasteCommand
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: {
        var pasted = String(text || "").replace(/[\r\n]+/g, " ")
        if (pasted.length > 0) {
          root.filterText = (root.filterText + pasted).slice(0, 4096)
        }
      }
    }
  }

  property var installedThemes: []

  Process {
    id: themeListProcess
    command: ["omarchy", "theme", "list"]
    running: true
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: {
        var lines = String(text || "").split(/\r?\n/)
        var list = []
        for (var i = 0; i < lines.length; i++) {
          var t = lines[i].trim()
          if (t.length > 0) list.push(t)
        }
        if (list.length > 0) {
          root.installedThemes = list
          root.refreshQuery()
        }
      }
    }
  }

  function reloadThemes() {
    themeListProcess.command = ["omarchy", "theme", "list"]
    themeListProcess.running = true
  }

  function pasteFromClipboard() {
    pasteProcess.command = root.pasteCommand
    pasteProcess.running = true
  }

  function pastePrimarySelection() {
    primaryPasteProcess.command = root.primaryPasteCommand
    primaryPasteProcess.running = true
  }

  function executeFileSearch() {
    var q = root.filterText.trim()
    if (q.length === 0) {
      root.fileResults = []
      return
    }
    root.searchGen += 1
    fdProcess.activeGen = root.searchGen
    fdProcess.command = Engine.buildFdArgs(q, root.homeDir)
    fdProcess.running = true
  }

  function pluginId() {
    return (root.manifest && root.manifest.id) || "fickleminded.iris"
  }

  function resolveIcon(iconName) {
    var value = String(iconName || "")
    if (value.length === 0) return Quickshell.iconPath("application-x-executable", true)
    if (value.indexOf("file://") === 0 || value.indexOf("image://") === 0) return value
    if (value.charAt(0) === "/") return Util.fileUrl(value)
    if (value === "iris" || value === "fickleminded.iris") {
      return Qt.resolvedUrl("assets/iris-logo.png")
    }
    if (root.shell && root.shell.appLibrary && typeof root.shell.appLibrary.iconSource === "function") {
      return root.shell.appLibrary.iconSource(value)
    }
    var themed = Quickshell.iconPath(value, true)
    if (themed && themed.length > 0) return themed
    return Quickshell.iconPath("application-x-executable", true)
  }

  // AI Agent Streaming Process & State (Phase 7)
  property string defaultAgent: ""
  property string aiPrompt: ""
  property string aiResponseText: ""
  property string aiErrorText: ""
  property string aiState: "idle" // "idle", "thinking", "streaming", "completed", "error"
  property int aiQueryGen: 0

  FileView {
    id: defaultAgentFile
    path: root.homeDir + "/.config/omarchy/defaults/agent"
    watchChanges: true
    printErrors: false
    onLoaded: {
      var val = String(text() || "").trim()
      root.defaultAgent = val
    }
    onFileChanged: {
      var val = String(text() || "").trim()
      root.defaultAgent = val
      root.refreshQuery()
    }
  }

  Timer {
    id: aiDebounceTimer
    interval: 600
    repeat: false
    onTriggered: root.executeAiQuery()
  }

  Process {
    id: aiProcess
    property int activeGen: 0
    stdout: SplitParser {
      onRead: function(line) {
        if (aiProcess.activeGen === root.aiQueryGen) {
          if (root.aiState !== "streaming") {
            root.aiState = "streaming"
          }
          root.aiResponseText = (root.aiResponseText.length > 0 ? root.aiResponseText + "\n" : "") + line
        }
      }
    }
    stderr: SplitParser {
      onRead: function(line) {
        if (aiProcess.activeGen === root.aiQueryGen) {
          root.aiErrorText = (root.aiErrorText.length > 0 ? root.aiErrorText + "\n" : "") + line
        }
      }
    }
    onExited: function(exitCode) {
      if (aiProcess.activeGen === root.aiQueryGen) {
        if (exitCode === 0) {
          root.aiState = "completed"
        } else {
          if (root.aiState !== "idle") {
            root.aiState = "error"
            if (root.aiErrorText.length === 0) {
              root.aiErrorText = "Process exited with code " + exitCode
            }
          }
        }
      }
    }
  }

  function executeAiQuery() {
    var prompt = root.aiPrompt.trim()
    if (prompt.length === 0) return
    if (!root.defaultAgent || root.defaultAgent.length === 0) {
      root.aiState = "idle"
      return
    }

    aiDebounceTimer.stop()
    if (aiProcess.running) {
      aiProcess.running = false
    }
    root.aiQueryGen += 1
    aiProcess.activeGen = root.aiQueryGen
    root.aiResponseText = ""
    root.aiErrorText = ""
    root.aiState = "thinking"
    aiProcess.command = Engine.buildAiInlineArgs(prompt)
    aiProcess.running = true
  }

  function cancelAiQuery() {
    aiDebounceTimer.stop()
    root.aiQueryGen += 1
    if (aiProcess.running) {
      aiProcess.running = false
    }
    root.aiState = "idle"
  }

  function refreshQuery() {
    var ctx = {
      applications: root.desktopApplications,
      fileResults: root.fileResults,
      themes: root.installedThemes,
      shell: root.shell,
      resolveIcon: root.resolveIcon,
      defaultAgent: root.defaultAgent
    }
    root.itemsList = Engine.search(root.filterText, ctx)
    if (root.selectedIndex >= root.itemsList.length) {
      root.selectedIndex = Math.max(0, root.itemsList.length - 1)
    }
  }

  onFilterTextChanged: {
    root.refreshQuery()
    if (root.filterText.trim().length === 0) {
      root.fileResults = []
      fileSearchTimer.stop()
    } else {
      fileSearchTimer.restart()
    }

    var parsedAi = Engine.parseAiQuery(root.filterText)
    if (parsedAi.isAi && !parsedAi.isGuide && parsedAi.prompt.length > 0) {
      if (parsedAi.prompt !== root.aiPrompt) {
        root.aiPrompt = parsedAi.prompt
        root.cancelAiQuery()
        aiDebounceTimer.restart()
      }
    } else {
      root.aiPrompt = ""
      root.cancelAiQuery()
      root.aiResponseText = ""
      root.aiErrorText = ""
    }
  }
  onDesktopApplicationsChanged: root.refreshQuery()
  onOpenedChanged: {
    if (root.opened) {
      root.pickRandomPlaceholder()
      root.reloadThemes()
      Qt.callLater(function() { keyCatcher.forceActiveFocus() })
    }
  }

  function open(payloadJson) {
    root.cancelAiQuery()
    root.aiPrompt = ""
    root.aiResponseText = ""
    root.aiErrorText = ""
    root.pickRandomPlaceholder()
    var query = ""
    if (typeof payloadJson === "string") {
      var trimmed = payloadJson.trim()
      if (trimmed.length > 0) {
        if (trimmed.charAt(0) === "{" && trimmed.charAt(trimmed.length - 1) === "}") {
          try {
            var payload = JSON.parse(trimmed)
            if (payload && typeof payload.query === "string") {
              query = payload.query
            }
          } catch (e) {
            query = trimmed
          }
        } else {
          query = trimmed
        }
      }
    } else if (payloadJson && typeof payloadJson.query === "string") {
      query = payloadJson.query
    }

    root.opened = true
    root.selectedIndex = 0
    root.filterText = query
    root.refreshQuery()
    Qt.callLater(function() { keyCatcher.forceActiveFocus() })
  }

  function close() {
    root.cancelAiQuery()
    root.opened = false
  }

  function dismiss() {
    root.close()
    if (root.shell && typeof root.shell.hide === "function") {
      root.shell.hide(root.pluginId())
    }
  }

  function toggle() {
    if (root.opened) root.dismiss()
    else root.open("{}")
  }

  function select(delta) {
    if (root.itemsList.length === 0) return
    var next = root.selectedIndex + delta
    if (next < 0) next = 0
    if (next >= root.itemsList.length) next = root.itemsList.length - 1
    root.selectedIndex = next
    resultListView.positionViewAtIndex(root.selectedIndex, ListView.Contain)
  }

  function activateItem(item) {
    if (!item) return
    if (item.kind === "hint" || item.kind === "guide") {
      if (item.fillQuery) {
        root.filterText = item.fillQuery
      }
      return
    }
    if (item.kind === "app") {
      Engine.launchApp(item, root.shell, Util)
    } else if (item.kind === "file") {
      Engine.openFile(item, Util)
    } else if (item.kind === "calc") {
      Engine.copyCalcResult(item, Util)
    } else if (item.kind === "system") {
      Engine.executeSystemAction(item, Util)
    } else if (item.kind === "web") {
      Engine.openWebUrl(item, Util)
    } else if (item.kind === "ai" || item.kind === "ai-setup") {
      Engine.launchAi(item, Util)
    }
    root.dismiss()
  }

  // Shell Overlay Window
  PanelWindow {
    id: panel
    visible: root.opened
    anchors { top: true; bottom: true; left: true; right: true }
    color: "transparent"
    WlrLayershell.namespace: "fickleminded-iris"
    WlrLayershell.layer: WlrLayer.Overlay
    WlrLayershell.keyboardFocus: root.opened ? WlrKeyboardFocus.Exclusive : WlrKeyboardFocus.None
    exclusionMode: ExclusionMode.Ignore

    // Dimming backdrop scrim
    Rectangle {
      anchors.fill: parent
      color: root.scrim
    }

    // Dismiss on clicking outside the card
    MouseArea {
      anchors.fill: parent
      onClicked: root.dismiss()
    }

    // Centered Spotlight Card
    BorderSurface {
      id: card
      width: root.currentCardWidth
      height: Math.min(root.maxCardHeight, headerBox.height + bodyBox.height + footerBox.height + root.contentSpacing * 2 + card.contentTopInset + card.contentBottomInset)
      radius: root.cornerRadius

      anchors.horizontalCenter: parent.horizontalCenter
      anchors.top: parent.top
      anchors.topMargin: Math.max(Style.space(70), Math.round(panel.height * 0.16))

      // Smooth adaptive width and height transitions
      Behavior on width {
        NumberAnimation { duration: 180; easing.type: Easing.OutCubic }
      }
      Behavior on height {
        NumberAnimation { duration: 160; easing.type: Easing.OutCubic }
      }

      color: root.background
      borderSpec: root.borderSpec
      padding: root.contentMargin

      // Prevent clicks inside card from dismissing
      MouseArea {
        anchors.fill: parent
        onClicked: {}
      }

      Item {
        id: keyCatcher
        anchors.fill: parent
        focus: true

        Keys.priority: Keys.BeforeItem
        Keys.onPressed: function(event) {
          if (event.key === Qt.Key_Escape) {
            if (root.aiState === "streaming" || root.aiState === "thinking") {
              root.cancelAiQuery()
            } else if (root.filterText && root.filterText.length > 0) {
              root.filterText = ""
            } else {
              root.dismiss()
            }
            event.accepted = true
          } else if (event.key === Qt.Key_Up || (event.modifiers & Qt.ControlModifier && (event.key === Qt.Key_P || event.key === Qt.Key_K))) {
            root.select(-1)
            event.accepted = true
          } else if (event.key === Qt.Key_Down || (event.modifiers & Qt.ControlModifier && (event.key === Qt.Key_N || event.key === Qt.Key_J))) {
            root.select(1)
            event.accepted = true
          } else if (event.key === Qt.Key_Home) {
            if (root.itemsList.length > 0) {
              root.selectedIndex = 0
              resultListView.positionViewAtIndex(0, ListView.Contain)
            }
            event.accepted = true
          } else if (event.key === Qt.Key_End) {
            if (root.itemsList.length > 0) {
              root.selectedIndex = root.itemsList.length - 1
              resultListView.positionViewAtIndex(root.selectedIndex, ListView.Contain)
            }
            event.accepted = true
          } else if ((event.modifiers & Qt.AltModifier) && (event.key === Qt.Key_Return || event.key === Qt.Key_Enter)) {
            if (root.selectedItem && root.selectedItem.kind === "file") {
              Engine.showInFolder(root.selectedItem, Util)
              root.dismiss()
            }
            event.accepted = true
          } else if ((event.modifiers & Qt.ControlModifier) && event.key === Qt.Key_T) {
            if (root.selectedItem && root.selectedItem.kind === "file") {
              Engine.openTerminal(root.selectedItem, Util)
              root.dismiss()
            }
            event.accepted = true
          } else if ((event.modifiers & Qt.ControlModifier) && (event.key === Qt.Key_C || event.key === Qt.Key_Y)) {
            if (root.selectedItem && root.selectedItem.kind === "file") {
              Engine.copyPath(root.selectedItem, Util)
            } else if (root.selectedItem && root.selectedItem.kind === "calc") {
              Engine.copyCalcResult(root.selectedItem, Util)
            } else if (root.selectedItem && (root.selectedItem.kind === "ai" || root.selectedItem.kind === "ai-setup")) {
              Engine.copyAiResponse(root.aiResponseText, Util)
            }
            event.accepted = true
          } else if (((event.modifiers & Qt.ControlModifier) && (event.key === Qt.Key_V || event.text === "v" || event.text === "V" || event.text === "\u0016")) ||
                     ((event.modifiers & Qt.ShiftModifier) && event.key === Qt.Key_Insert)) {
            root.pasteFromClipboard()
            event.accepted = true
          } else if (event.key === Qt.Key_Return || event.key === Qt.Key_Enter) {
            if (root.selectedItem) root.activateItem(root.selectedItem)
            event.accepted = true
          } else if (event.key === Qt.Key_Tab) {
            if (root.selectedItem && root.selectedItem.fillQuery) {
              root.filterText = root.selectedItem.fillQuery
            }
            event.accepted = true
          } else if (event.modifiers & Qt.ControlModifier && event.key === Qt.Key_W) {
            root.filterText = root.filterText.replace(/\s+$/, "").replace(/\S+$/, "")
            event.accepted = true
          } else if (event.modifiers & Qt.ControlModifier && event.key === Qt.Key_U) {
            root.filterText = ""
            event.accepted = true
          } else if (Util.editsFilter(event, root.filterText)) {
            root.filterText = Util.editedFilter(event, root.filterText)
            event.accepted = true
          } else if (event.text && event.text.length === 1 && event.text.charCodeAt(0) >= 32 && event.text.charCodeAt(0) !== 127 && (event.modifiers === Qt.NoModifier || event.modifiers === Qt.ShiftModifier)) {
            root.filterText = root.filterText + event.text
            event.accepted = true
          }
        }

        Column {
          anchors.fill: parent
          spacing: root.contentSpacing

          // Search Header Line
          Row {
            id: headerBox
            width: parent.width
            height: root.headerHeight
            spacing: Style.spacing.sm

            Text {
              id: searchIcon
              anchors.verticalCenter: parent.verticalCenter
              width: Style.space(26)
              text: "󰍉"
              textFormat: Text.PlainText
              font.family: root.fontFamily
              font.pixelSize: Style.font.title
              color: root.accent
              horizontalAlignment: Text.AlignHCenter
            }

            Item {
              id: searchInputContainer
              width: parent.width - searchIcon.width - (clearButton.visible ? clearButton.width : 0) - headerBadge.width - parent.spacing * 3
              height: parent.height
              anchors.verticalCenter: parent.verticalCenter

              Text {
                id: placeholder
                anchors.fill: parent
                verticalAlignment: Text.AlignVCenter
                text: root.currentPlaceholder
                textFormat: Text.PlainText
                font.family: root.fontFamily
                font.pixelSize: Style.font.title
                color: root.foreground
                opacity: 0.35
                visible: root.filterText.length === 0
              }

              Text {
                id: queryDisplay
                anchors.fill: parent
                verticalAlignment: Text.AlignVCenter
                text: root.filterText
                textFormat: Text.PlainText
                font.family: root.fontFamily
                font.pixelSize: Style.font.title
                color: root.foreground
                elide: Text.ElideRight
              }

              MouseArea {
                anchors.fill: parent
                acceptedButtons: Qt.LeftButton | Qt.RightButton | Qt.MiddleButton
                cursorShape: Qt.IBeamCursor
                onClicked: function(mouse) {
                  if (mouse.button === Qt.RightButton) {
                    root.pasteFromClipboard()
                  } else if (mouse.button === Qt.MiddleButton) {
                    root.pastePrimarySelection()
                  } else {
                    keyCatcher.forceActiveFocus()
                  }
                }
              }
            }

            // Clear Button
            Rectangle {
              id: clearButton
              visible: root.filterText.length > 0
              width: Style.space(24)
              height: Style.space(24)
              radius: width / 2
              anchors.verticalCenter: parent.verticalCenter
              color: clearMouseArea.containsMouse ? Util.alpha(root.foreground, 0.15) : "transparent"

              Text {
                anchors.centerIn: parent
                text: "󰅖"
                textFormat: Text.PlainText
                font.family: root.fontFamily
                font.pixelSize: Style.font.body
                color: root.foreground
                opacity: 0.7
              }

              MouseArea {
                id: clearMouseArea
                anchors.fill: parent
                hoverEnabled: true
                cursorShape: Qt.PointingHandCursor
                onClicked: root.filterText = ""
              }
            }

            // Iris Badge with Rosette Glyph
            Rectangle {
              id: headerBadge
              anchors.verticalCenter: parent.verticalCenter
              width: badgeRow.implicitWidth + Style.spacing.sm * 2
              height: Style.space(22)
              radius: Style.space(4)
              color: Util.alpha(root.accent, 0.18)

              Row {
                id: badgeRow
                anchors.centerIn: parent
                spacing: Style.space(6)

                Image {
                  id: badgeIcon
                  anchors.verticalCenter: parent.verticalCenter
                  width: Style.space(14)
                  height: Style.space(14)
                  source: Qt.resolvedUrl("assets/iris-glyph-rosette.svg")
                  sourceSize.width: Style.space(28)
                  sourceSize.height: Style.space(28)
                  fillMode: Image.PreserveAspectFit
                }

                Text {
                  id: badgeText
                  anchors.verticalCenter: parent.verticalCenter
                  text: "Iris"
                  textFormat: Text.PlainText
                  font.family: root.fontFamily
                  font.pixelSize: Math.max(10, Style.font.caption)
                  font.bold: true
                  color: root.accent
                }
              }
            }
          }

          // Body: Results List + (Adaptive Preview Pane)
          Row {
            id: bodyBox
            width: parent.width
            height: root.hasPreview ? Style.space(340) : Math.min(Style.space(340), Math.max(Style.space(160), root.itemsList.length * root.rowHeight))
            spacing: Style.spacing.md

            // Left Pane: Results List
            Item {
              id: listPane
              width: root.hasPreview ? Math.round(parent.width * 0.54) : parent.width
              height: parent.height

              Behavior on width {
                NumberAnimation { duration: 180; easing.type: Easing.OutCubic }
              }

              ListView {
                id: resultListView
                anchors.fill: parent
                clip: true
                boundsBehavior: Flickable.StopAtBounds
                model: root.itemsList

                delegate: Rectangle {
                  id: delegateRoot
                  required property int index
                  required property var modelData

                  readonly property bool isSelected: index === root.selectedIndex
                  width: resultListView.width
                  height: root.rowHeight
                  radius: root.cornerRadius
                  color: isSelected ? root.selectedBackground : "transparent"

                  Rectangle {
                    visible: delegateRoot.isSelected
                    anchors.left: parent.left
                    anchors.verticalCenter: parent.verticalCenter
                    width: Style.space(3)
                    height: parent.height - Style.space(14)
                    radius: width / 2
                    color: root.accent
                  }

                  Item {
                    id: itemIconContainer
                    anchors.left: parent.left
                    anchors.leftMargin: Style.spacing.sm + Style.space(4)
                    anchors.verticalCenter: parent.verticalCenter
                    width: Style.space(26)
                    height: Style.space(26)

                    Image {
                      id: appIconImage
                      anchors.fill: parent
                      fillMode: Image.PreserveAspectFit
                      asynchronous: true
                      source: delegateRoot.modelData.iconSource || ""
                      sourceSize.width: width * Screen.devicePixelRatio
                      sourceSize.height: height * Screen.devicePixelRatio
                      visible: status === Image.Ready && source != ""
                    }

                    Text {
                      anchors.centerIn: parent
                      visible: !appIconImage.visible
                      width: Style.space(24)
                      horizontalAlignment: Text.AlignHCenter
                      text: delegateRoot.modelData.icon || "󰍉"
                      textFormat: Text.PlainText
                      color: delegateRoot.isSelected ? root.selectedText : root.foreground
                      font.family: root.fontFamily
                      font.pixelSize: Style.font.title
                    }
                  }

                  Column {
                    anchors.left: itemIconContainer.right
                    anchors.leftMargin: Style.spacing.sm
                    anchors.right: categoryTag.left
                    anchors.rightMargin: Style.spacing.sm
                    anchors.verticalCenter: parent.verticalCenter
                    spacing: Style.space(2)

                    Row {
                      width: parent.width
                      spacing: Style.spacing.xs

                      Text {
                        text: delegateRoot.modelData.name || ""
                        textFormat: Text.PlainText
                        font.family: root.fontFamily
                        font.pixelSize: Style.font.body
                        font.bold: delegateRoot.isSelected
                        color: delegateRoot.isSelected ? root.selectedText : root.foreground
                        elide: Text.ElideRight
                      }

                      Rectangle {
                        visible: Boolean(delegateRoot.modelData.dangerLevel === "high")
                        anchors.verticalCenter: parent.verticalCenter
                        height: Style.space(16)
                        width: dangerBadge.implicitWidth + Style.spacing.xs * 2
                        radius: Style.space(3)
                        color: Util.alpha(Color.urgent || "#e05252", 0.22)
                        border.color: Color.urgent || "#e05252"
                        border.width: 1

                        Text {
                          id: dangerBadge
                          anchors.centerIn: parent
                          text: "POWER"
                          font.family: root.fontFamily
                          font.pixelSize: Math.max(8, Style.font.caption - 2)
                          font.bold: true
                          color: Color.urgent || "#e05252"
                        }
                      }

                      Rectangle {
                        visible: Boolean(delegateRoot.modelData.isTopHit === true && delegateRoot.modelData.dangerLevel !== "high")
                        anchors.verticalCenter: parent.verticalCenter
                        height: Style.space(16)
                        width: topHitBadge.implicitWidth + Style.spacing.xs * 2
                        radius: Style.space(3)
                        color: root.accent

                        Text {
                          id: topHitBadge
                          anchors.centerIn: parent
                          text: "TOP HIT"
                          font.family: root.fontFamily
                          font.pixelSize: Math.max(8, Style.font.caption - 2)
                          font.bold: true
                          color: Color.menu.selectedText
                        }
                      }
                    }

                    Text {
                      width: parent.width
                      text: delegateRoot.modelData.description || ""
                      textFormat: Text.PlainText
                      font.family: root.fontFamily
                      font.pixelSize: Math.max(10, Style.font.body - 3)
                      color: delegateRoot.isSelected ? root.selectedText : root.foreground
                      opacity: delegateRoot.isSelected ? 0.75 : 0.5
                      elide: Text.ElideRight
                    }
                  }

                  // Category Tag
                  Text {
                    id: categoryTag
                    anchors.right: parent.right
                    anchors.rightMargin: Style.spacing.sm
                    anchors.verticalCenter: parent.verticalCenter
                    text: delegateRoot.modelData.category || ""
                    textFormat: Text.PlainText
                    font.family: root.fontFamily
                    font.pixelSize: Math.max(9, Style.font.caption)
                    color: delegateRoot.isSelected ? root.selectedText : root.foreground
                    opacity: 0.5
                  }

                  MouseArea {
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onContainsMouseChanged: if (containsMouse) root.selectedIndex = delegateRoot.index
                    onClicked: {
                      root.selectedIndex = delegateRoot.index
                      root.activateItem(delegateRoot.modelData)
                    }
                  }
                }
              }
            }

            // Divider line (visible only when two-pane preview active)
            Rectangle {
              visible: root.hasPreview
              width: 1
              height: parent.height
              color: root.border
              opacity: 0.6
            }

            // Right Pane: Adaptive Quick Look / Preview Pane
            Item {
              id: previewPane
              visible: root.hasPreview
              width: parent.width - listPane.width - Style.spacing.md - 1
              height: parent.height
              clip: true

              // 1. Applications Preview (Phase 2)
              Previews.AppPreview {
                visible: Boolean(root.selectedItem && root.selectedItem.previewType === "app")
                anchors.fill: parent
                item: root.selectedItem
                fontFamily: root.fontFamily
                foreground: root.foreground
                accent: root.accent
                border: root.border
                cornerRadius: root.cornerRadius
                onLaunchRequested: root.activateItem(root.selectedItem)
              }

              // 2. Files & Folders Preview (Phase 3)
              Previews.FilePreview {
                visible: Boolean(root.selectedItem && root.selectedItem.previewType === "file")
                anchors.fill: parent
                item: root.selectedItem
                fontFamily: root.fontFamily
                foreground: root.foreground
                accent: root.accent
                border: root.border
                cornerRadius: root.cornerRadius
                onOpenRequested: root.activateItem(root.selectedItem)
                onShowFolderRequested: {
                  Engine.showInFolder(root.selectedItem, Util)
                  root.dismiss()
                }
                onTerminalRequested: {
                  Engine.openTerminal(root.selectedItem, Util)
                  root.dismiss()
                }
                onCopyRequested: {
                  Engine.copyPath(root.selectedItem, Util)
                }
              }

              // 3. Calculator & Unit Conversion Preview (Phase 4)
              Previews.CalcPreview {
                visible: Boolean(root.selectedItem && root.selectedItem.previewType === "calc")
                anchors.fill: parent
                item: root.selectedItem
                fontFamily: root.fontFamily
                foreground: root.foreground
                accent: root.accent
                border: root.border
                cornerRadius: root.cornerRadius
                onCopyRequested: {
                  Engine.copyCalcResult(root.selectedItem, Util)
                  root.dismiss()
                }
              }

              // 4. System Controls Preview (Phase 5)
              Previews.SystemPreview {
                visible: Boolean(root.selectedItem && root.selectedItem.previewType === "system")
                anchors.fill: parent
                item: root.selectedItem
                fontFamily: root.fontFamily
                foreground: root.foreground
                accent: root.accent
                border: root.border
                cornerRadius: root.cornerRadius
                onExecuteRequested: root.activateItem(root.selectedItem)
              }

              // 5. Web Search & Bang Shortcuts Preview (Phase 6)
              Previews.WebPreview {
                visible: Boolean(root.selectedItem && root.selectedItem.previewType === "web")
                anchors.fill: parent
                item: root.selectedItem
                fontFamily: root.fontFamily
                foreground: root.foreground
                accent: root.accent
                border: root.border
                cornerRadius: root.cornerRadius
                onOpenRequested: root.activateItem(root.selectedItem)
              }

              // 6. AI Agent Preview (Phase 7)
              Previews.AiPreview {
                visible: Boolean(root.selectedItem && root.selectedItem.previewType === "ai")
                anchors.fill: parent
                item: root.selectedItem
                aiPrompt: root.aiPrompt
                aiResponseText: root.aiResponseText
                aiErrorText: root.aiErrorText
                aiState: root.aiState
                fontFamily: root.fontFamily
                foreground: root.foreground
                accent: root.accent
                border: root.border
                cornerRadius: root.cornerRadius
                onLaunchRequested: root.activateItem(root.selectedItem)
                onCopyRequested: Engine.copyAiResponse(root.aiResponseText, Util)
                onCancelRequested: root.cancelAiQuery()
              }

              // 7. Generic / Demo Preview Fallback
              Column {
                visible: Boolean(!root.selectedItem || (root.selectedItem.previewType !== "app" && root.selectedItem.previewType !== "file" && root.selectedItem.previewType !== "calc" && root.selectedItem.previewType !== "system" && root.selectedItem.previewType !== "web" && root.selectedItem.previewType !== "ai"))
                anchors.fill: parent
                anchors.margins: Style.spacing.sm
                spacing: Style.spacing.sm

                Row {
                  spacing: Style.spacing.sm
                  Text {
                    text: root.selectedItem ? root.selectedItem.icon : "󰋩"
                    font.family: root.fontFamily
                    font.pixelSize: Style.font.display
                    color: root.accent
                  }
                  Column {
                    anchors.verticalCenter: parent.verticalCenter
                    Text {
                      text: root.selectedItem ? root.selectedItem.name : "Preview"
                      textFormat: Text.PlainText
                      font.family: root.fontFamily
                      font.pixelSize: Style.font.subtitle
                      font.bold: true
                      color: root.foreground
                    }
                    Text {
                      text: root.selectedItem ? root.selectedItem.category : ""
                      textFormat: Text.PlainText
                      font.family: root.fontFamily
                      font.pixelSize: Style.font.caption
                      color: root.foreground
                      opacity: 0.6
                    }
                  }
                }

                Rectangle {
                  width: parent.width
                  height: 1
                  color: root.border
                  opacity: 0.4
                }

                Text {
                  width: parent.width
                  text: root.selectedItem ? root.selectedItem.description : ""
                  textFormat: Text.PlainText
                  font.family: root.fontFamily
                  font.pixelSize: Style.font.body
                  color: root.foreground
                  opacity: 0.8
                  wrapMode: Text.WordWrap
                }

                Item { width: 1; height: Style.space(16) }

                Rectangle {
                  width: parent.width
                  height: Style.space(32)
                  radius: root.cornerRadius
                  color: Util.alpha(root.accent, 0.15)

                  Row {
                    anchors.centerIn: parent
                    spacing: Style.spacing.xs
                    Text {
                      text: "󰌌"
                      font.family: root.fontFamily
                      font.pixelSize: Style.font.body
                      color: root.accent
                    }
                    Text {
                      text: "Press Enter to select"
                      font.family: root.fontFamily
                      font.pixelSize: Style.font.caption
                      font.bold: true
                      color: root.accent
                    }
                  }
                }
              }
            }
          }

          // Footer Line: Controls & Shortcuts Guide
          Row {
            id: footerBox
            width: parent.width
            height: Style.space(24)
            spacing: Style.spacing.md

            Text {
              text: "↑↓ Navigate"
              font.family: root.fontFamily
              font.pixelSize: Math.max(10, Style.font.caption)
              color: root.foreground
              opacity: 0.45
            }
            Text {
              text: "↵ Open"
              font.family: root.fontFamily
              font.pixelSize: Math.max(10, Style.font.caption)
              color: root.foreground
              opacity: 0.45
            }
            Text {
              text: "Esc Dismiss"
              font.family: root.fontFamily
              font.pixelSize: Math.max(10, Style.font.caption)
              color: root.foreground
              opacity: 0.45
            }
          }
        }
      }
    }
  }
}
