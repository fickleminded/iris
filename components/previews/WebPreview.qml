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

  readonly property color brandColor: root.item && root.item.badgeColor ? root.item.badgeColor : root.accent

  signal openRequested()

  Column {
    anchors.fill: parent
    anchors.margins: Style.spacing.md
    spacing: Style.spacing.md

    // Header section: Brand Icon, Title, and Badges
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
          color: Util.alpha(root.brandColor, 0.16)

          Text {
            anchors.centerIn: parent
            text: root.item && root.item.icon ? root.item.icon : "󰖟"
            font.family: root.fontFamily
            font.pixelSize: Style.space(24)
            color: root.brandColor
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
            text: root.item && root.item.engineName ? root.item.engineName : "Web Search"
            font.family: root.fontFamily
            font.pixelSize: Style.font.title
            font.bold: true
            color: root.foreground
            elide: Text.ElideRight
          }

          // Engine / Bang Badge
          Rectangle {
            visible: Boolean(root.item && root.item.badge)
            anchors.verticalCenter: parent.verticalCenter
            height: Style.space(16)
            width: badgeText.implicitWidth + Style.spacing.xs * 2
            radius: Style.space(3)
            color: Util.alpha(root.brandColor, 0.2)
            border.color: root.brandColor
            border.width: 1

            Text {
              id: badgeText
              anchors.centerIn: parent
              text: root.item && root.item.badge ? root.item.badge : ""
              font.family: root.fontFamily
              font.pixelSize: Math.max(8, Style.font.caption - 2)
              font.bold: true
              color: root.brandColor
            }
          }

          // Top Hit Badge
          Rectangle {
            visible: Boolean(root.item && root.item.isTopHit === true)
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

    // Destination URL & Query Card
    Rectangle {
      width: parent.width
      height: Math.max(Style.space(80), detailCol.implicitHeight + Style.spacing.md * 2)
      radius: root.cornerRadius
      color: Util.alpha(root.brandColor, 0.06)
      border.color: Util.alpha(root.brandColor, 0.25)
      border.width: 1

      Column {
        id: detailCol
        anchors.centerIn: parent
        width: parent.width - Style.spacing.md * 2
        spacing: Style.space(8)

        Row {
          spacing: Style.spacing.xs
          Text {
            text: "Destination URL"
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            font.bold: true
            color: root.foreground
            opacity: 0.7
          }
        }

        // Inline URL Pill
        Rectangle {
          height: Style.space(28)
          width: parent.width
          radius: Style.space(4)
          color: Util.alpha(root.foreground, 0.08)

          Row {
            anchors.centerIn: parent
            width: parent.width - Style.spacing.sm * 2
            spacing: Style.spacing.xs

            Text {
              text: "󰌹"
              font.family: root.fontFamily
              font.pixelSize: Style.font.body
              color: root.brandColor
            }

            Text {
              width: parent.width - Style.space(20)
              text: root.item && root.item.url ? root.item.url : ""
              font.family: Style.font.monoFamily || "monospace"
              font.pixelSize: Math.max(9, Style.font.caption - 1)
              color: root.foreground
              opacity: 0.95
              elide: Text.ElideMiddle
            }
          }
        }
      }
    }

    // Info notice
    Rectangle {
      width: parent.width
      height: Style.space(34)
      radius: root.cornerRadius
      color: Util.alpha(root.foreground, 0.04)

      Row {
        anchors.centerIn: parent
        spacing: Style.spacing.xs

        Text {
          text: "󰖟"
          font.family: root.fontFamily
          font.pixelSize: Style.font.body
          color: root.accent
        }

        Text {
          text: "Launches in your default web browser."
          font.family: root.fontFamily
          font.pixelSize: Math.max(9, Style.font.caption)
          color: root.foreground
          opacity: 0.75
        }
      }
    }

    Item {
      width: 1
      height: Style.space(10)
    }

    // Action Button
    Rectangle {
      id: actionBtn
      width: parent.width
      height: Style.space(38)
      radius: root.cornerRadius
      color: actionMouseArea.containsMouse ? root.brandColor : Util.alpha(root.brandColor, 0.22)

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
          color: actionMouseArea.containsMouse ? Color.menu.selectedText : root.brandColor
        }

        Text {
          text: "Press Enter to Open in Browser"
          font.family: root.fontFamily
          font.pixelSize: Style.font.body
          font.bold: true
          color: actionMouseArea.containsMouse ? Color.menu.selectedText : root.brandColor
        }
      }

      MouseArea {
        id: actionMouseArea
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: root.openRequested()
      }
    }
  }
}
