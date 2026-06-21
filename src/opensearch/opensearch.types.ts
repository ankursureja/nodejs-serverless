export interface OpenSearchFieldMapping {
    type: string;
    fields?: Record<string, OpenSearchFieldMapping>;
}

export interface OpenSearchIndexMappings {
    properties: Record<string, OpenSearchFieldMapping>;
}
