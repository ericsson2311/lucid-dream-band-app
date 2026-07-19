import TiptapBulletList from "@tiptap/extension-bullet-list";

// Erweitert die normale Aufzählungsliste um ein "listStyle"-Attribut,
// damit Punkt- und Strich-Listen dieselbe Listenart nutzen und sich
// per Knopfdruck ineinander umwandeln lassen.
export const BulletList = TiptapBulletList.extend({
  addAttributes() {
    return {
      listStyle: {
        default: "bullet",
        parseHTML: (element) => element.getAttribute("data-list-style") || "bullet",
        renderHTML: (attributes) => ({
          "data-list-style": attributes.listStyle,
        }),
      },
    };
  },
});

export function setBulletListStyle(editor, style) {
  if (editor.isActive("bulletList")) {
    editor.chain().focus().updateAttributes("bulletList", { listStyle: style }).run();
  } else {
    editor
      .chain()
      .focus()
      .toggleBulletList()
      .updateAttributes("bulletList", { listStyle: style })
      .run();
  }
}
