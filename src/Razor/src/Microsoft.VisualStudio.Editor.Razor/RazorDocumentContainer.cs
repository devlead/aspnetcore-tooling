// Copyright (c) .NET Foundation. All rights reserved.
// Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.

using System;
using Microsoft.CodeAnalysis.ExternalAccess.Razor;
using Microsoft.CodeAnalysis.Razor.ProjectSystem;

namespace Microsoft.CodeAnalysis.Razor
{
    // This types purpose is to serve as a non-Razor specific document delivery mechanism for Roslyn.
    internal sealed class RazorDocumentContainer : IRazorDocumentContainer
    {
        private readonly DocumentSnapshot _documentSnapshot;
        private RazorDocumentExcerptService _excerptService;
        private RazorSpanMappingService _mappingService;

        public RazorDocumentContainer(DocumentSnapshot documentSnapshot)
        {
            if (documentSnapshot is null)
            {
                throw new ArgumentNullException(nameof(documentSnapshot));
            }

            _documentSnapshot = documentSnapshot;
        }

        public string FilePath => _documentSnapshot.FilePath;

        public TextLoader GetTextLoader(string filePath) => new GeneratedDocumentTextLoader(_documentSnapshot, filePath);

        public IRazorDocumentExcerptService GetExcerptService()
        {
            if (_excerptService == null)
            {
                var mappingService = GetMappingService();
                _excerptService = new RazorDocumentExcerptService(_documentSnapshot, mappingService);
            }

            return _excerptService;
        }

        public IRazorSpanMappingService GetMappingService()
        {
            if (_mappingService == null)
            {
                _mappingService = new RazorSpanMappingService(_documentSnapshot);
            }

            return _mappingService;
        }
    }
}