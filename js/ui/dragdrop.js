// HeroRPG remake — HTML5 drag-and-drop helpers for the Inventory screen
// (DESIGN.md §8: Auto-Equip / Unequip / Discard drop boxes, New_Player_Guide.md).
// Risk note (PLAN.md): drag-and-drop jank without a framework — every draggable row also
// gets always-visible fallback buttons, wired separately in the inventory screen.

var Game = window.Game || {};

Game.DragDrop = (function () {

  // Makes `node` draggable, carrying itemId via dataTransfer.
  function makeDraggable(node, itemId) {
    node.setAttribute('draggable', 'true');
    node.addEventListener('dragstart', function (ev) {
      ev.dataTransfer.setData('text/plain', itemId);
      node.className += ' dragging';
    });
    node.addEventListener('dragend', function () {
      node.className = node.className.replace(/\s*dragging\b/, '');
    });
  }

  // Makes `node` a drop target; onDrop(itemId) is called with the dragged item's id.
  function makeDropTarget(node, onDrop) {
    // Fix #7: dragover fires continuously while hovering, so appending ' drop-hover'
    // unconditionally on every event stacked up multiple occurrences in node.className; the
    // dragleave/drop cleanup regex lacked the /g flag and only ever stripped ONE occurrence,
    // leaving the class (and its CSS) stuck on after the drag ended. Only add the class if it's
    // not already present, and strip ALL occurrences on cleanup.
    node.addEventListener('dragover', function (ev) {
      ev.preventDefault();
      if (!/\bdrop-hover\b/.test(node.className)) node.className += ' drop-hover';
    });
    node.addEventListener('dragleave', function () {
      node.className = node.className.replace(/\s*drop-hover\b/g, '');
    });
    node.addEventListener('drop', function (ev) {
      ev.preventDefault();
      node.className = node.className.replace(/\s*drop-hover\b/g, '');
      var itemId = ev.dataTransfer.getData('text/plain');
      if (itemId) onDrop(itemId);
    });
  }

  return {
    makeDraggable: makeDraggable,
    makeDropTarget: makeDropTarget
  };
})();

window.Game = Game;
