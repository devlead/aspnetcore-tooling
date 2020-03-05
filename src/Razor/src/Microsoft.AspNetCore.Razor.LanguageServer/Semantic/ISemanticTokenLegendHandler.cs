﻿// Copyright (c) .NET Foundation. All rights reserved.
// Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.

using System.Threading.Tasks;
using MediatR;
using OmniSharp.Extensions.JsonRpc;
using OmniSharp.Extensions.LanguageServer.Protocol;

namespace Microsoft.AspNetCore.Razor.LanguageServer.Semantic
{
    [Method("razor/semanticTokenLegend")]
    [Parallel]
    internal interface ISemanticTokenLegendHandler :
        IJsonRpcRequestHandler<SemanticTokenLegendParams, SemanticTokenLegend>,
        IRequestHandler<SemanticTokenLegendParams, SemanticTokenLegend>,
        IJsonRpcHandler,
        ICapability<SemanticTokenLegendCapability>
    {
    }
}