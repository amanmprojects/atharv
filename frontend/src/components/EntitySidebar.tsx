'use client';

import { Entity } from '@/lib/api';
import { Users, MapPin, Building, Calendar, MoreHorizontal } from 'lucide-react';

interface EntitySidebarProps {
  entities: Entity[];
  relationships: Array<{
    source_id: string;
    target_id: string;
    relation_type: string;
    context: string;
  }>;
  onEntityClick?: (entityId: string) => void;
}

const entityTypeIcons: Record<string, React.ReactNode> = {
  person: <Users size={16} />,
  location: <MapPin size={16} />,
  organization: <Building size={16} />,
  date: <Calendar size={16} />,
  misc: <MoreHorizontal size={16} />,
};

const entityTypeColors: Record<string, string> = {
  person: 'bg-blue-100 text-blue-800 border-blue-200',
  location: 'bg-green-100 text-green-800 border-green-200',
  organization: 'bg-purple-100 text-purple-800 border-purple-200',
  date: 'bg-orange-100 text-orange-800 border-orange-200',
  misc: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function EntitySidebar({ entities, relationships, onEntityClick }: EntitySidebarProps) {
  const groupedEntities = entities.reduce((acc, entity) => {
    const type = entity.entity_type || 'misc';
    if (!acc[type]) acc[type] = [];
    acc[type].push(entity);
    return acc;
  }, {} as Record<string, Entity[]>);

  const getEntityName = (id: string): string => {
    const entity = entities.find(e => e.id === id);
    return entity?.name || 'Unknown';
  };

  return (
    <div className="h-full flex flex-col bg-white border-l">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Users size={20} />
          Entity Graph
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {entities.length} entities found
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {Object.entries(groupedEntities).map(([type, typeEntities]) => (
          <div key={type} className="border-b">
            <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
              {entityTypeIcons[type] || <MoreHorizontal size={16} />}
              <span className="font-medium capitalize">{type}s</span>
              <span className="text-sm text-gray-500">({typeEntities.length})</span>
            </div>
            <ul className="divide-y">
              {typeEntities.map((entity) => (
                <li
                  key={entity.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onEntityClick?.(entity.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{entity.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      entityTypeColors[type] || entityTypeColors.misc
                    }`}>
                      {entity.mentions.length} mentions
                    </span>
                  </div>
                  {entity.attributes && Object.keys(entity.attributes).length > 0 && (
                    <div className="mt-1 text-sm text-gray-500">
                      {Object.entries(entity.attributes).map(([key, value]) => (
                        <span key={key} className="mr-2">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {relationships.length > 0 && (
          <div className="p-4">
            <h3 className="font-medium text-sm text-gray-600 mb-2">Relationships</h3>
            <ul className="space-y-2">
              {relationships.slice(0, 10).map((rel, idx) => (
                <li
                  key={idx}
                  className="text-sm bg-gray-50 rounded p-2"
                >
                  <span className="font-medium">{getEntityName(rel.source_id)}</span>
                  <span className="text-gray-500 mx-1">→</span>
                  <span className="text-blue-600">{rel.relation_type}</span>
                  <span className="text-gray-500 mx-1">→</span>
                  <span className="font-medium">{getEntityName(rel.target_id)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {entities.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Users size={48} className="mx-auto mb-2 opacity-30" />
            <p>No entities detected yet.</p>
            <p className="text-sm mt-1">Start writing to track characters, locations, and more.</p>
          </div>
        )}
      </div>
    </div>
  );
}
