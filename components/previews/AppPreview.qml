import QtQuick
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

  signal launchRequested()

  Column {
    anchors.fill: parent
    anchors.margins: Style.spacing.md
    spacing: Style.spacing.md

    // Header section: App Icon, Name, and Badges
    Row {
      width: parent.width
      spacing: Style.spacing.md

      // App Icon with HiDPI Image and fallback glyph
      Item {
        width: Style.space(56)
        height: Style.space(56)
        anchors.verticalCenter: parent.verticalCenter

        Image {
          id: iconImage
          anchors.fill: parent
          fillMode: Image.PreserveAspectFit
          asynchronous: true
          source: root.item && root.item.iconSource ? root.item.iconSource : ""
          sourceSize.width: width * Screen.devicePixelRatio
          sourceSize.height: height * Screen.devicePixelRatio
          visible: status === Image.Ready && source != ""
        }

        Rectangle {
          anchors.fill: parent
          radius: Style.space(12)
          color: Util.alpha(root.accent, 0.15)
          visible: !iconImage.visible

          Text {
            anchors.centerIn: parent
            text: root.item && root.item.icon ? root.item.icon : "󰀻"
            font.family: root.fontFamily
            font.pixelSize: Style.space(28)
            color: root.accent
          }
        }
      }

      // App Name & Subtext
      Column {
        width: parent.width - Style.space(56) - parent.spacing
        anchors.verticalCenter: parent.verticalCenter
        spacing: Style.space(3)

        Row {
          width: parent.width
          spacing: Style.spacing.sm

          Text {
            text: root.item && root.item.name ? root.item.name : ""
            textFormat: Text.PlainText
            font.family: root.fontFamily
            font.pixelSize: Style.font.title
            font.bold: true
            color: root.foreground
            elide: Text.ElideRight
            maximumLineCount: 1
          }

          // Top Hit Badge
          Rectangle {
            visible: Boolean(root.item && root.item.isTopHit === true)
            anchors.verticalCenter: parent.verticalCenter
            height: Style.space(18)
            width: topHitText.implicitWidth + Style.spacing.xs * 2
            radius: Style.space(4)
            color: root.accent

            Text {
              id: topHitText
              anchors.centerIn: parent
              text: "TOP HIT"
              font.family: root.fontFamily
              font.pixelSize: Math.max(9, Style.font.caption - 1)
              font.bold: true
              color: Color.menu.selectedText
            }
          }
        }

        Text {
          width: parent.width
          text: root.item && root.item.description ? root.item.description : "Desktop Application"
          textFormat: Text.PlainText
          font.family: root.fontFamily
          font.pixelSize: Style.font.body
          color: root.foreground
          opacity: 0.65
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

    // Description & Detail Area
    Item {
      width: parent.width
      height: Math.max(Style.space(80), descColumn.implicitHeight)

      Column {
        id: descColumn
        width: parent.width
        spacing: Style.spacing.sm

        Text {
          visible: Boolean(root.item && root.item.comment && root.item.comment.length > 0 && root.item.comment !== root.item.description)
          width: parent.width
          text: root.item && root.item.comment ? root.item.comment : ""
          textFormat: Text.PlainText
          font.family: root.fontFamily
          font.pixelSize: Style.font.body
          color: root.foreground
          opacity: 0.85
          wrapMode: Text.WordWrap
          maximumLineCount: 3
          elide: Text.ElideRight
        }

        // Metadata Tags (Desktop ID & Terminal badge)
        Flow {
          width: parent.width
          spacing: Style.spacing.xs

          // Desktop ID pill
          Rectangle {
            height: Style.space(22)
            width: idLabel.implicitWidth + Style.spacing.sm * 2
            radius: Style.space(4)
            color: Util.alpha(root.foreground, 0.08)

            Text {
              id: idLabel
              anchors.centerIn: parent
              text: (root.item && root.item.appId ? root.item.appId : "") + ".desktop"
              font.family: root.fontFamily
              font.pixelSize: Math.max(10, Style.font.caption)
              color: root.foreground
              opacity: 0.75
            }
          }

          // Terminal requirement pill
          Rectangle {
            visible: Boolean(root.item && root.item.terminal === true)
            height: Style.space(22)
            width: termLabel.implicitWidth + Style.spacing.sm * 2
            radius: Style.space(4)
            color: Util.alpha(root.accent, 0.15)

            Text {
              id: termLabel
              anchors.centerIn: parent
              text: "Terminal App"
              font.family: root.fontFamily
              font.pixelSize: Math.max(10, Style.font.caption)
              font.bold: true
              color: root.accent
            }
          }
        }
      }
    }

    Item {
      width: 1
      height: Style.space(12)
    }

    // Prominent Action Button
    Rectangle {
      id: launchBtn
      width: parent.width
      height: Style.space(38)
      radius: root.cornerRadius
      color: launchMouseArea.containsMouse ? root.accent : Util.alpha(root.accent, 0.2)

      Behavior on color {
        ColorAnimation { duration: 120 }
      }

      Row {
        anchors.centerIn: parent
        spacing: Style.spacing.sm

        Text {
          text: "󰌌"
          font.family: root.fontFamily
          font.pixelSize: Style.font.body
          color: launchMouseArea.containsMouse ? Color.menu.selectedText : root.accent
        }

        Text {
          text: "Press Enter to Launch"
          font.family: root.fontFamily
          font.pixelSize: Style.font.body
          font.bold: true
          color: launchMouseArea.containsMouse ? Color.menu.selectedText : root.accent
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
  }
}
