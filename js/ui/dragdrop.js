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
    node.addEventListener('dragover', function (ev) {
      ev.preventDefault();
      node.className += ' drop-hover';
    });
    node.addEventListener('dragleave', function () {
      node.className = node.className.replace(/\s*drop-hover\b/, '');
    });
    node.addEventListener('drop', function (ev) {
      ev.preventDefault();
      node.className = node.className.replace(/\s*drop-hover\b/, '');
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
