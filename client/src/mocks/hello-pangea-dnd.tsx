// Mock @hello-pangea/dnd for development
import React from 'react';

export const DragDropContext = ({ children, onDragEnd }: any) => {
  return <>{children}</>;
};

export const Droppable = ({ children, droppableId }: any) => {
  const provided = {
    droppableProps: {},
    innerRef: React.useRef(null),
    placeholder: null
  };
  return <>{children(provided)}</>;
};

export const Draggable = ({ children, draggableId, index }: any) => {
  const provided = {
    draggableProps: {},
    dragHandleProps: {},
    innerRef: React.useRef(null)
  };
  const snapshot = {
    isDragging: false
  };
  return <>{children(provided, snapshot)}</>;
};