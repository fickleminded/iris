import QtQuick
import qs.Commons
import qs.Ui

Item {
  id: root

  property var item: null
  property string aiPrompt: ""
  property string aiResponseText: ""
  property string aiErrorText: ""
  property string aiState: "idle" // "idle", "thinking", "streaming", "completed", "error"

  property string fontFamily: Style.font.menuFamily
  property color foreground: Color.menu.text
  property color accent: Color.accent
  property color border: Color.menu.border
  property int cornerRadius: Style.cornerRadius

  signal launchRequested()
  signal copyRequested()
  signal cancelRequested()

  readonly property var agentMeta: root.item && root.item.agent ? root.item.agent : null
  readonly property string agentName: root.agentMeta && root.agentMeta.name ? root.agentMeta.name : "AI Agent"
  readonly property string agentBadge: (root.item && root.item.badge) || (root.agentMeta && root.agentMeta.badge) || "AI"
  readonly property string agentIcon: (root.item && root.item.icon) || (root.agentMeta && root.agentMeta.icon) || "󰚩"
  readonly property color agentColor: (root.agentMeta && root.agentMeta.color) || (root.item && root.item.badgeColor) || root.accent

  readonly property bool isConfigured: Boolean(root.agentMeta && root.agentMeta.isConfigured !== false && root.agentMeta.id !== "unset")

  readonly property string effectivePrompt: root.aiPrompt.length > 0
    ? root.aiPrompt
    : (root.item && root.item.prompt ? root.item.prompt : "")

  readonly property bool isGuideMode: Boolean(root.item && (root.item.kind === "hint" || root.item.id === "ai-guide" || root.item.id === "ai-setup-guide" || root.effectivePrompt.length === 0))

  readonly property string statusBadgeText: {
    if (!root.isConfigured) return "SETUP"
    if (root.aiState === "thinking") return "THINKING..."
    if (root.aiState === "streaming") return "STREAMING"
    if (root.aiState === "completed") return "READY"
    if (root.aiState === "error") return "ERROR"
    return "READY"
  }

  readonly property color statusColor: {
    if (!root.isConfigured) return root.accent
    if (root.aiState === "thinking") return Color.warning || "#f59e0b"
    if (root.aiState === "streaming") return root.accent
    if (root.aiState === "completed") return Color.positive || "#10b981"
    if (root.aiState === "error") return Color.urgent || "#e05252"
    return Util.alpha(root.foreground, 0.45)
  }

  function sanitizeMarkdown(src) {
    if (!src) return ""
    var out = String(src)

    // 1. Strip container media blocks (svg, picture, video, audio, object, iframe) and their contents
    out = out.replace(/<(?:picture|svg|video|audio|object|iframe)\b[\s\S]*?<\/(?:picture|svg|video|audio|object|iframe)>/gi, "")

    // 2. Strip standalone/void media and image tags (img, embed, source)
    out = out.replace(/<\/?(?:img|embed|source)\b[\s\S]*?>/gi, "")

    // 3. Strip any remaining HTML tag containing an image/media src, srcset, or background attribute
    out = out.replace(/<[a-z][a-z0-9]*\b[^>]*?\b(?:src|srcset|background)\s*=[\s\S]*?>/gi, "")

    // 4. Neutralize all Markdown image forms:
    //    - Inline images: ![alt](url "title")
    //    - Full reference images: ![alt][ref]
    //    - Collapsed reference images: ![ref][]
    //    - Shortcut reference images: ![ref]
    out = out.replace(/!\[([^\]]*)\](?:\s*\((?:[^()]*|\([^()]*\))*\)|[ \t]*(?:\r?\n[ \t]*)?\[([^\]]*)\])?/g, function(match, alt, ref) {
      var label = String(alt || ref || "").trim()
      return label ? "[image: " + label + "]" : "[image]"
    })

    // 4. Neutralize any remaining "![" markers (e.g. malformed or unclosed image syntax)
    out = out.replace(/!\[/g, "[image: ")

    return out
  }

  Column {
    anchors.fill: parent
    anchors.margins: Style.spacing.md
    spacing: Style.space(8)

    // 1. Header: Agent Icon, Name, Agent Badge, and Status Pill
    Row {
      id: headerRow
      width: parent.width
      height: Style.space(42)
      spacing: Style.spacing.md

      Rectangle {
        width: Style.space(40)
        height: Style.space(40)
        radius: Style.space(10)
        color: Util.alpha(root.agentColor, 0.16)
        anchors.verticalCenter: parent.verticalCenter

        Text {
          anchors.centerIn: parent
          text: root.agentIcon
          font.family: root.fontFamily
          font.pixelSize: Style.space(22)
          color: root.agentColor
        }
      }

      Column {
        width: parent.width - Style.space(40) - parent.spacing
        anchors.verticalCenter: parent.verticalCenter
        spacing: Style.space(2)

        Row {
          width: parent.width
          spacing: Style.spacing.xs

          Text {
            text: root.agentName
            font.family: root.fontFamily
            font.pixelSize: Style.font.subtitle
            font.bold: true
            color: root.foreground
            elide: Text.ElideRight
          }

          // Agent ID Pill
          Rectangle {
            anchors.verticalCenter: parent.verticalCenter
            height: Style.space(16)
            width: agentBadgeText.implicitWidth + Style.spacing.xs * 2
            radius: Style.space(3)
            color: Util.alpha(root.agentColor, 0.18)
            border.color: root.agentColor
            border.width: 1

            Text {
              id: agentBadgeText
              anchors.centerIn: parent
              text: root.agentBadge
              font.family: root.fontFamily
              font.pixelSize: Math.max(8, Style.font.caption - 2)
              font.bold: true
              color: root.agentColor
            }
          }

          // Status Indicator Pill
          Rectangle {
            anchors.verticalCenter: parent.verticalCenter
            height: Style.space(16)
            width: statusBadgeLabel.implicitWidth + Style.space(14) + Style.spacing.xs * 2
            radius: Style.space(3)
            color: Util.alpha(root.statusColor, 0.18)
            border.color: root.statusColor
            border.width: 1

            Row {
              anchors.centerIn: parent
              spacing: Style.space(4)

              Rectangle {
                width: Style.space(6)
                height: Style.space(6)
                radius: width / 2
                color: root.statusColor
                anchors.verticalCenter: parent.verticalCenter

                SequentialAnimation on opacity {
                  running: root.aiState === "thinking" || root.aiState === "streaming"
                  loops: Animation.Infinite
                  NumberAnimation { to: 0.3; duration: 450; easing.type: Easing.InOutQuad }
                  NumberAnimation { to: 1.0; duration: 450; easing.type: Easing.InOutQuad }
                }
              }

              Text {
                id: statusBadgeLabel
                anchors.verticalCenter: parent.verticalCenter
                text: root.statusBadgeText
                font.family: root.fontFamily
                font.pixelSize: Math.max(8, Style.font.caption - 2)
                font.bold: true
                color: root.statusColor
              }
            }
          }
        }

        Text {
          width: parent.width
          text: root.agentMeta && root.agentMeta.description ? root.agentMeta.description : "Omarchy AI Coding Agent"
          font.family: root.fontFamily
          font.pixelSize: Math.max(9, Style.font.caption)
          color: root.foreground
          opacity: 0.6
          elide: Text.ElideRight
        }
      }
    }

    // Divider
    Rectangle {
      width: parent.width
      height: 1
      color: root.border
      opacity: 0.4
    }

    // 2. Prompt Quote Callout Box
    Rectangle {
      id: promptBox
      width: parent.width
      height: Math.max(Style.space(30), promptText.implicitHeight + Style.space(10))
      radius: Style.space(6)
      color: Util.alpha(root.foreground, 0.04)
      border.color: Util.alpha(root.border, 0.3)
      border.width: 1

      // Left Accent Indicator
      Rectangle {
        anchors.left: parent.left
        anchors.top: parent.top
        anchors.bottom: parent.bottom
        width: Style.space(3)
        radius: width / 2
        color: root.agentColor
      }

      Row {
        anchors.fill: parent
        anchors.leftMargin: Style.space(10)
        anchors.rightMargin: Style.space(8)
        anchors.topMargin: Style.space(4)
        anchors.bottomMargin: Style.space(4)
        spacing: Style.space(6)

        Text {
          text: "󰝰"
          font.family: root.fontFamily
          font.pixelSize: Style.font.body
          color: root.agentColor
          opacity: 0.8
        }

        Text {
          id: promptText
          width: parent.width - Style.space(24)
          anchors.verticalCenter: parent.verticalCenter
          text: root.effectivePrompt.length > 0
            ? root.effectivePrompt
            : ("Ask " + root.agentName + " anything with 'ai <prompt>' or '? <prompt>'...")
          textFormat: Text.PlainText
          font.family: root.fontFamily
          font.pixelSize: Math.max(9, Style.font.caption)
          font.italic: root.effectivePrompt.length === 0
          color: root.foreground
          opacity: root.effectivePrompt.length > 0 ? 0.95 : 0.5
          elide: Text.ElideRight
          maximumLineCount: 2
        }
      }
    }

    // 3. Response Viewport
    Rectangle {
      id: responseContainer
      width: parent.width
      height: parent.height - headerRow.height - promptBox.height - toolbarRow.height - parent.spacing * 4
      radius: root.cornerRadius
      color: Util.alpha(root.foreground, 0.03)
      border.color: Util.alpha(root.border, 0.4)
      border.width: 1
      clip: true

      // State 0: Setup Required (No default agent configured)
      Column {
        visible: !root.isConfigured
        anchors.centerIn: parent
        width: parent.width - Style.spacing.md * 2
        spacing: Style.space(8)

        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          text: "󰚩"
          font.family: root.fontFamily
          font.pixelSize: Style.space(38)
          color: root.accent
        }

        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          text: "No Default AI Agent"
          font.family: root.fontFamily
          font.pixelSize: Style.font.title
          font.bold: true
          color: root.foreground
        }

        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          width: Math.min(parent.width, Style.space(320))
          text: "Omarchy supports Antigravity, Claude Code, Gemini, OpenCode, Codex, and more. Press Enter to choose your default agent."
          font.family: root.fontFamily
          font.pixelSize: Math.max(9, Style.font.caption)
          color: root.foreground
          opacity: 0.65
          horizontalAlignment: Text.AlignHCenter
          wrapMode: Text.WordWrap
        }
      }

      // State A: Guide / Idle State (no prompt entered yet)
      Column {
        visible: root.isConfigured && root.isGuideMode && root.aiResponseText.length === 0 && root.aiState !== "thinking"
        anchors.centerIn: parent
        width: parent.width - Style.spacing.md * 2
        spacing: Style.space(8)

        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          text: root.agentIcon
          font.family: root.fontFamily
          font.pixelSize: Style.space(38)
          color: Util.alpha(root.agentColor, 0.6)
        }

        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          text: "Ask " + root.agentName
          font.family: root.fontFamily
          font.pixelSize: Style.font.title
          font.bold: true
          color: root.foreground
        }

        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          width: Math.min(parent.width, Style.space(320))
          text: "Type a prompt to stream live answers directly inside Iris, or press Enter to launch an interactive terminal session."
          font.family: root.fontFamily
          font.pixelSize: Math.max(9, Style.font.caption)
          color: root.foreground
          opacity: 0.6
          horizontalAlignment: Text.AlignHCenter
          wrapMode: Text.WordWrap
        }
      }

      // State B: Thinking Spinner (Waiting for first stream token)
      Column {
        visible: root.aiState === "thinking"
        anchors.centerIn: parent
        spacing: Style.space(8)

        Text {
          id: spinnerIcon
          anchors.horizontalCenter: parent.horizontalCenter
          text: "󰑮"
          font.family: root.fontFamily
          font.pixelSize: Style.space(32)
          color: root.accent

          NumberAnimation on rotation {
            running: root.aiState === "thinking"
            loops: Animation.Infinite
            from: 0
            to: 360
            duration: 900
          }
        }

        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          text: "Thinking..."
          font.family: root.fontFamily
          font.pixelSize: Style.font.body
          font.bold: true
          color: root.foreground
        }

        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          text: "Streaming response from " + root.agentName
          font.family: root.fontFamily
          font.pixelSize: Math.max(9, Style.font.caption)
          color: root.foreground
          opacity: 0.55
        }
      }

      // State C: Error Display
      Column {
        visible: root.aiState === "error"
        anchors.centerIn: parent
        width: parent.width - Style.spacing.md * 2
        spacing: Style.space(6)

        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          text: "󰅚"
          font.family: root.fontFamily
          font.pixelSize: Style.space(30)
          color: Color.urgent || "#e05252"
        }

        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          text: "Generation Failed"
          font.family: root.fontFamily
          font.pixelSize: Style.font.body
          font.bold: true
          color: Color.urgent || "#e05252"
        }

        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          width: parent.width
          text: root.aiErrorText.length > 0 ? root.aiErrorText : "The agent process exited with an error."
          textFormat: Text.PlainText
          font.family: Style.font.monoFamily || "monospace"
          font.pixelSize: Math.max(9, Style.font.caption)
          color: root.foreground
          opacity: 0.75
          horizontalAlignment: Text.AlignHCenter
          wrapMode: Text.WordWrap
          maximumLineCount: 4
          elide: Text.ElideRight
        }
      }

      // State D: Streamed / Markdown Response Viewport
      Flickable {
        id: responseFlickable
        visible: (root.aiState === "streaming" || root.aiState === "completed" || root.aiResponseText.length > 0) && root.aiState !== "error" && root.aiState !== "thinking"
        anchors.fill: parent
        anchors.margins: Style.spacing.sm
        boundsBehavior: Flickable.StopAtBounds
        clip: true
        contentWidth: width
        contentHeight: responseColumn.implicitHeight + Style.space(12)

        Column {
          id: responseColumn
          width: parent.width
          spacing: Style.space(4)

          Text {
            id: responseMarkdown
            width: parent.width
            text: root.sanitizeMarkdown(root.aiResponseText)
            textFormat: Text.MarkdownText
            wrapMode: Text.Wrap
            font.family: root.fontFamily
            font.pixelSize: Style.font.body
            color: root.foreground
            lineHeight: 1.25
          }

          // Blinking cursor indicator while streaming
          Row {
            visible: root.aiState === "streaming"
            spacing: Style.space(4)

            Rectangle {
              width: Style.space(8)
              height: Style.space(14)
              radius: Style.space(2)
              color: root.accent

              SequentialAnimation on opacity {
                running: root.aiState === "streaming"
                loops: Animation.Infinite
                NumberAnimation { to: 0.15; duration: 350; easing.type: Easing.InOutQuad }
                NumberAnimation { to: 1.0; duration: 350; easing.type: Easing.InOutQuad }
              }
            }

            Text {
              text: "streaming..."
              font.family: root.fontFamily
              font.pixelSize: Math.max(8, Style.font.caption - 2)
              color: root.accent
              opacity: 0.7
            }
          }
        }

        // Auto-scroll to bottom as new tokens stream in
        onContentHeightChanged: {
          if (root.aiState === "streaming") {
            responseFlickable.contentY = Math.max(0, responseFlickable.contentHeight - responseFlickable.height)
          }
        }
      }
    }

    // 4. Action Toolbar Row
    Row {
      id: toolbarRow
      width: parent.width
      height: Style.space(34)
      spacing: Style.spacing.xs

      readonly property bool canCopy: root.aiResponseText.length > 0
      readonly property bool canCancel: root.aiState === "thinking" || root.aiState === "streaming"
      readonly property int visibleButtons: 1 + (canCopy ? 1 : 0) + (canCancel ? 1 : 0)
      readonly property real buttonWidth: (width - Style.spacing.xs * (visibleButtons - 1)) / Math.max(1, visibleButtons)

      // Button 1: Launch Interactive Session in Terminal
      Rectangle {
        width: toolbarRow.buttonWidth
        height: parent.height
        radius: root.cornerRadius
        color: launchMouseArea.containsMouse ? root.agentColor : Util.alpha(root.agentColor, 0.2)

        Behavior on color { ColorAnimation { duration: 120 } }

        Row {
          anchors.centerIn: parent
          spacing: Style.space(5)

          Text {
            text: "󰌌"
            font.family: root.fontFamily
            font.pixelSize: Style.font.body
            color: launchMouseArea.containsMouse ? Color.menu.selectedText : root.agentColor
          }

          Text {
            text: !root.isConfigured ? "↵ Choose Default Agent" : "↵ Launch Terminal"
            font.family: root.fontFamily
            font.pixelSize: Math.max(9, Style.font.caption)
            font.bold: true
            color: launchMouseArea.containsMouse ? Color.menu.selectedText : root.agentColor
          }
        }

        MouseArea {
          id: launchMouseArea
          anchors.fill: parent
          hoverEnabled: true
          cursorShape: Qt.PointingHandCursor
          onClicked: root.launchRequested()
        }
      }

      // Button 2: Copy Response to Clipboard
      Rectangle {
        visible: toolbarRow.canCopy
        width: toolbarRow.buttonWidth
        height: parent.height
        radius: root.cornerRadius
        color: copyMouseArea.containsMouse ? root.accent : Util.alpha(root.accent, 0.16)

        Behavior on color { ColorAnimation { duration: 120 } }

        Row {
          anchors.centerIn: parent
          spacing: Style.space(5)

          Text {
            text: "󰆏"
            font.family: root.fontFamily
            font.pixelSize: Style.font.body
            color: copyMouseArea.containsMouse ? Color.menu.selectedText : root.accent
          }

          Text {
            text: "^C Copy Answer"
            font.family: root.fontFamily
            font.pixelSize: Math.max(9, Style.font.caption)
            font.bold: true
            color: copyMouseArea.containsMouse ? Color.menu.selectedText : root.accent
          }
        }

        MouseArea {
          id: copyMouseArea
          anchors.fill: parent
          hoverEnabled: true
          cursorShape: Qt.PointingHandCursor
          onClicked: root.copyRequested()
        }
      }

      // Button 3: Cancel Active Query
      Rectangle {
        visible: toolbarRow.canCancel
        width: toolbarRow.buttonWidth
        height: parent.height
        radius: root.cornerRadius
        color: cancelMouseArea.containsMouse ? (Color.urgent || "#e05252") : Util.alpha(Color.urgent || "#e05252", 0.16)

        Behavior on color { ColorAnimation { duration: 120 } }

        Row {
          anchors.centerIn: parent
          spacing: Style.space(5)

          Text {
            text: "󰅖"
            font.family: root.fontFamily
            font.pixelSize: Style.font.body
            color: cancelMouseArea.containsMouse ? Color.menu.selectedText : (Color.urgent || "#e05252")
          }

          Text {
            text: "Esc Cancel"
            font.family: root.fontFamily
            font.pixelSize: Math.max(9, Style.font.caption)
            font.bold: true
            color: cancelMouseArea.containsMouse ? Color.menu.selectedText : (Color.urgent || "#e05252")
          }
        }

        MouseArea {
          id: cancelMouseArea
          anchors.fill: parent
          hoverEnabled: true
          cursorShape: Qt.PointingHandCursor
          onClicked: root.cancelRequested()
        }
      }
    }
  }
}
