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

  readonly property bool isDanger: Boolean(root.item && (root.item.dangerLevel === "high" || root.item.isDestructive))
  readonly property bool isMediumDanger: Boolean(root.item && root.item.dangerLevel === "medium")
  readonly property color actionColor: isDanger ? (Color.urgent || "#e05252") : (isMediumDanger ? "#e5a50a" : root.accent)

  signal executeRequested()

  Column {
    anchors.fill: parent
    anchors.margins: Style.spacing.md
    spacing: Style.spacing.md

    // Header section: Action Icon, Title, and Badges
    Row {
      width: parent.width
      spacing: Style.spacing.md

      Item {
        width: Style.space(48)
        height: Style.space(48)
        anchors.verticalCenter: parent.verticalCenter

        Rectangle {
          anchors.fill: parent
          radius: Style.space(12)
          color: Util.alpha(root.actionColor, 0.16)

          Text {
            anchors.centerIn: parent
            text: root.item && root.item.icon ? root.item.icon : "󰑓"
            font.family: root.fontFamily
            font.pixelSize: Style.space(24)
            color: root.actionColor
          }
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
            text: root.item && root.item.name ? root.item.name : "System Action"
            textFormat: Text.PlainText
            font.family: root.fontFamily
            font.pixelSize: Style.font.title
            font.bold: true
            color: root.foreground
            elide: Text.ElideRight
          }

          // Danger / Power Badge
          Rectangle {
            visible: root.isDanger
            anchors.verticalCenter: parent.verticalCenter
            height: Style.space(16)
            width: dangerText.implicitWidth + Style.spacing.xs * 2
            radius: Style.space(3)
            color: Util.alpha(root.actionColor, 0.22)
            border.color: root.actionColor
            border.width: 1

            Text {
              id: dangerText
              anchors.centerIn: parent
              text: "POWER"
              font.family: root.fontFamily
              font.pixelSize: Math.max(8, Style.font.caption - 2)
              font.bold: true
              color: root.actionColor
            }
          }

          // Top Hit Badge
          Rectangle {
            visible: Boolean(root.item && root.item.isTopHit === true && !root.isDanger)
            anchors.verticalCenter: parent.verticalCenter
            height: Style.space(16)
            width: topHitText.implicitWidth + Style.spacing.xs * 2
            radius: Style.space(3)
            color: root.accent

            Text {
              id: topHitText
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
          text: root.item && root.item.description ? root.item.description : ""
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

    // Command Details Card
    Rectangle {
      width: parent.width
      height: Math.max(Style.space(80), detailCol.implicitHeight + Style.spacing.md * 2)
      radius: root.cornerRadius
      color: Util.alpha(root.actionColor, 0.06)
      border.color: Util.alpha(root.actionColor, 0.25)
      border.width: 1

      Column {
        id: detailCol
        anchors.centerIn: parent
        width: parent.width - Style.spacing.md * 2
        spacing: Style.space(8)

        Text {
          width: parent.width
          text: root.item && root.item.detailText ? root.item.detailText : ""
          textFormat: Text.PlainText
          font.family: root.fontFamily
          font.pixelSize: Style.font.caption
          color: root.foreground
          opacity: 0.85
          wrapMode: Text.WordWrap
        }

        // Inline Code Command pill
        Rectangle {
          height: Style.space(26)
          width: Math.min(parent.width, cmdRow.implicitWidth + Style.spacing.sm * 2)
          radius: Style.space(4)
          color: Util.alpha(root.foreground, 0.08)

          Row {
            id: cmdRow
            anchors.centerIn: parent
            spacing: Style.spacing.xs

            Text {
              text: ">_"
              font.family: Style.font.monoFamily || "monospace"
              font.pixelSize: Math.max(9, Style.font.caption - 1)
              font.bold: true
              color: root.actionColor
            }

            Text {
              text: root.item && root.item.command ? root.item.command : ""
              textFormat: Text.PlainText
              font.family: Style.font.monoFamily || "monospace"
              font.pixelSize: Math.max(9, Style.font.caption - 1)
              color: root.foreground
              opacity: 0.9
            }
          }
        }
      }
    }

    // Warning alert box for destructive actions
    Rectangle {
      visible: root.isDanger
      width: parent.width
      height: Style.space(36)
      radius: root.cornerRadius
      color: Util.alpha(root.actionColor, 0.12)
      border.color: Util.alpha(root.actionColor, 0.3)
      border.width: 1

      Row {
        anchors.centerIn: parent
        spacing: Style.spacing.xs

        Text {
          text: "⚠"
          font.family: root.fontFamily
          font.pixelSize: Style.font.body
          color: root.actionColor
        }

        Text {
          text: "Will close active application windows."
          font.family: root.fontFamily
          font.pixelSize: Math.max(9, Style.font.caption)
          font.bold: true
          color: root.actionColor
        }
      }
    }

    Item {
      width: 1
      height: root.isDanger ? Style.space(2) : Style.space(10)
    }

    // Execution Button
    Rectangle {
      id: actionBtn
      width: parent.width
      height: Style.space(38)
      radius: root.cornerRadius
      color: actionMouseArea.containsMouse ? root.actionColor : Util.alpha(root.actionColor, 0.22)

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
          color: actionMouseArea.containsMouse ? Color.menu.selectedText : root.actionColor
        }

        Text {
          text: root.isDanger ? "Press Enter to Confirm" : (root.item && root.item.category === "Theme" ? "Press Enter to Apply Theme" : (root.item && root.item.id === "sys-theme-bg-switcher" ? "Press Enter to Open Wallpaper Picker" : (root.item && (root.item.terminal || root.item.id === "sys-update") ? "Press Enter to Run in Terminal" : "Press Enter to Execute")))
          font.family: root.fontFamily
          font.pixelSize: Style.font.body
          font.bold: true
          color: actionMouseArea.containsMouse ? Color.menu.selectedText : root.actionColor
        }
      }

      MouseArea {
        id: actionMouseArea
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: root.executeRequested()
      }
    }
  }
}
