import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui

Item {
  id: root

  property var item: null
  property string fontFamily: Style.font.menuFamily
  property color foreground: Color.menu.text
  property color accent: Color.accent
  property color border: Color.menu.border
  property int cornerRadius: Style.cornerRadius

  signal openRequested()
  signal showFolderRequested()
  signal terminalRequested()
  signal copyRequested()

  readonly property bool isImage: Boolean(root.item && root.item.category === "Images")
  readonly property bool isCodeOrText: Boolean(root.item && (root.item.category === "Code" || root.item.category === "Documents") && !root.item.isFolder && root.item.extension !== "pdf")
  readonly property bool isFolder: Boolean(root.item && root.item.isFolder === true)

  property string fileSnippet: ""

  // Asynchronous snippet loader for code and text files
  Process {
    id: snippetProc
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: {
        root.fileSnippet = String(text || "").trim()
      }
    }
  }

  onItemChanged: {
    root.fileSnippet = ""
    if (root.isCodeOrText && root.item && root.item.path) {
      snippetProc.command = ["head", "-n", "24", root.item.path]
      snippetProc.running = true
    }
  }

  Column {
    anchors.fill: parent
    anchors.margins: Style.spacing.md
    spacing: Style.spacing.sm

    // Header: File Icon, Name, and Category Pill
    Row {
      width: parent.width
      spacing: Style.spacing.md

      Rectangle {
        width: Style.space(48)
        height: Style.space(48)
        radius: Style.space(10)
        color: Util.alpha(root.accent, 0.15)
        anchors.verticalCenter: parent.verticalCenter

        Text {
          anchors.centerIn: parent
          text: root.item ? root.item.icon : "󰈔"
          font.family: root.fontFamily
          font.pixelSize: Style.space(26)
          color: root.accent
        }
      }

      Column {
        width: parent.width - Style.space(48) - parent.spacing
        anchors.verticalCenter: parent.verticalCenter
        spacing: Style.space(2)

        Row {
          width: parent.width
          spacing: Style.spacing.sm

          Text {
            text: root.item && root.item.name ? root.item.name : ""
            textFormat: Text.PlainText
            font.family: root.fontFamily
            font.pixelSize: Style.font.subtitle
            font.bold: true
            color: root.foreground
            elide: Text.ElideRight
            maximumLineCount: 1
          }

          Rectangle {
            anchors.verticalCenter: parent.verticalCenter
            height: Style.space(18)
            width: catLabel.implicitWidth + Style.spacing.xs * 2
            radius: Style.space(4)
            color: Util.alpha(root.accent, 0.18)

            Text {
              id: catLabel
              anchors.centerIn: parent
              text: root.item && root.item.category ? root.item.category : "File"
              font.family: root.fontFamily
              font.pixelSize: Math.max(9, Style.font.caption - 1)
              font.bold: true
              color: root.accent
            }
          }
        }

        Text {
          width: parent.width
          text: root.item && root.item.path ? root.item.path : ""
          textFormat: Text.PlainText
          font.family: root.fontFamily
          font.pixelSize: Math.max(10, Style.font.caption)
          color: root.foreground
          opacity: 0.55
          elide: Text.ElideMiddle
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

    // Content Preview Area
    Item {
      width: parent.width
      height: Style.space(210)
      clip: true

      // 1. Image Thumbnail Preview
      Item {
        visible: root.isImage
        anchors.fill: parent

        Image {
          id: thumbImage
          anchors.centerIn: parent
          width: Math.min(parent.width, implicitWidth > 0 ? implicitWidth : parent.width)
          height: Math.min(parent.height, implicitHeight > 0 ? implicitHeight : parent.height)
          fillMode: Image.PreserveAspectFit
          asynchronous: true
          source: root.isImage && root.item ? Util.fileUrl(root.item.path) : ""
          sourceSize.width: width * Screen.devicePixelRatio
          sourceSize.height: height * Screen.devicePixelRatio
          visible: status === Image.Ready
        }

        Rectangle {
          visible: thumbImage.status !== Image.Ready
          anchors.fill: parent
          radius: root.cornerRadius
          color: Util.alpha(root.foreground, 0.05)

          Text {
            anchors.centerIn: parent
            text: "Loading image preview..."
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            color: root.foreground
            opacity: 0.5
          }
        }
      }

      // 2. Code / Text Snippet Viewer
      Rectangle {
        visible: root.isCodeOrText
        anchors.fill: parent
        radius: Style.space(6)
        color: Util.alpha(root.foreground, 0.04)
        border.color: Util.alpha(root.border, 0.5)
        border.width: 1

        Flickable {
          anchors.fill: parent
          anchors.margins: Style.spacing.sm
          contentWidth: codeDisplay.implicitWidth
          contentHeight: codeDisplay.implicitHeight
          clip: true
          boundsBehavior: Flickable.StopAtBounds

          Text {
            id: codeDisplay
            text: root.fileSnippet.length > 0 ? root.fileSnippet : "Loading preview..."
            textFormat: Text.PlainText
            font.family: Style.font.monospaceFamily || "monospace"
            font.pixelSize: Math.max(10, Style.font.caption)
            color: root.foreground
            opacity: 0.85
          }
        }
      }

      // 3. Folder / Other Info Preview
      Rectangle {
        visible: !root.isImage && !root.isCodeOrText
        anchors.fill: parent
        radius: Style.space(6)
        color: Util.alpha(root.foreground, 0.04)

        Column {
          anchors.centerIn: parent
          spacing: Style.spacing.sm

          Text {
            anchors.horizontalCenter: parent.horizontalCenter
            text: root.isFolder ? "󰉋" : "󰈔"
            font.family: root.fontFamily
            font.pixelSize: Style.space(44)
            color: root.accent
          }

          Text {
            anchors.horizontalCenter: parent.horizontalCenter
            text: root.isFolder ? "Directory Folder" : (root.item && root.item.extension ? (root.item.extension.toUpperCase() + " File") : "File")
            textFormat: Text.PlainText
            font.family: root.fontFamily
            font.pixelSize: Style.font.body
            font.bold: true
            color: root.foreground
          }

          Text {
            anchors.horizontalCenter: parent.horizontalCenter
            text: root.item ? root.item.description : ""
            textFormat: Text.PlainText
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            color: root.foreground
            opacity: 0.6
          }
        }
      }
    }

    // Action Shortcuts Grid / Prompt
    Row {
      width: parent.width
      height: Style.space(34)
      spacing: Style.spacing.xs

      // Open Action Button
      Rectangle {
        width: (parent.width - Style.spacing.xs * 3) / 4
        height: parent.height
        radius: root.cornerRadius
        color: openMouseArea.containsMouse ? root.accent : Util.alpha(root.accent, 0.16)

        Row {
          anchors.centerIn: parent
          spacing: Style.space(4)
          Text {
            text: "↵"
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            font.bold: true
            color: openMouseArea.containsMouse ? Color.menu.selectedText : root.accent
          }
          Text {
            text: "Open"
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            font.bold: true
            color: openMouseArea.containsMouse ? Color.menu.selectedText : root.accent
          }
        }

        MouseArea {
          id: openMouseArea
          anchors.fill: parent
          hoverEnabled: true
          cursorShape: Qt.PointingHandCursor
          onClicked: root.openRequested()
        }
      }

      // Show in Folder Button
      Rectangle {
        width: (parent.width - Style.spacing.xs * 3) / 4
        height: parent.height
        radius: root.cornerRadius
        color: folderMouseArea.containsMouse ? root.accent : Util.alpha(root.foreground, 0.08)

        Row {
          anchors.centerIn: parent
          spacing: Style.space(4)
          Text {
            text: "󰉋"
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            color: folderMouseArea.containsMouse ? Color.menu.selectedText : root.foreground
          }
          Text {
            text: "Reveal"
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            color: folderMouseArea.containsMouse ? Color.menu.selectedText : root.foreground
          }
        }

        MouseArea {
          id: folderMouseArea
          anchors.fill: parent
          hoverEnabled: true
          cursorShape: Qt.PointingHandCursor
          onClicked: root.showFolderRequested()
        }
      }

      // Open in Terminal Button
      Rectangle {
        width: (parent.width - Style.spacing.xs * 3) / 4
        height: parent.height
        radius: root.cornerRadius
        color: termMouseArea.containsMouse ? root.accent : Util.alpha(root.foreground, 0.08)

        Row {
          anchors.centerIn: parent
          spacing: Style.space(4)
          Text {
            text: "󰆍"
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            color: termMouseArea.containsMouse ? Color.menu.selectedText : root.foreground
          }
          Text {
            text: "Terminal"
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            color: termMouseArea.containsMouse ? Color.menu.selectedText : root.foreground
          }
        }

        MouseArea {
          id: termMouseArea
          anchors.fill: parent
          hoverEnabled: true
          cursorShape: Qt.PointingHandCursor
          onClicked: root.terminalRequested()
        }
      }

      // Copy Path Button
      Rectangle {
        width: (parent.width - Style.spacing.xs * 3) / 4
        height: parent.height
        radius: root.cornerRadius
        color: copyMouseArea.containsMouse ? root.accent : Util.alpha(root.foreground, 0.08)

        Row {
          anchors.centerIn: parent
          spacing: Style.space(4)
          Text {
            text: "󰅌"
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            color: copyMouseArea.containsMouse ? Color.menu.selectedText : root.foreground
          }
          Text {
            text: "Copy"
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            color: copyMouseArea.containsMouse ? Color.menu.selectedText : root.foreground
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
    }
  }
}
