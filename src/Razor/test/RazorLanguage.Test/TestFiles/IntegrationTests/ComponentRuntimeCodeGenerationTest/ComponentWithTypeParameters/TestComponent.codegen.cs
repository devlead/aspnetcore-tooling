// <auto-generated/>
#pragma warning disable 1591
namespace Test
{
    #line hidden
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Components;
    public class TestComponent<TItem1, TItem2> : Microsoft.AspNetCore.Components.ComponentBase
    {
        #pragma warning disable 1998
        protected override void BuildRenderTree(Microsoft.AspNetCore.Components.RenderTree.RenderTreeBuilder builder)
        {
            builder.AddMarkupContent(0, "<h1>Item1</h1>\r\n");
#nullable restore
#line 6 "x:\dir\subdir\Test\TestComponent.cshtml"
 foreach (var item2 in Items2)
{

#line default
#line hidden
#nullable disable
            builder.AddContent(1, "    ");
            builder.OpenElement(2, "p");
            builder.AddMarkupContent(3, "\r\n    ");
            builder.AddContent(4, ChildContent(item2));
            builder.AddMarkupContent(5, ";\r\n    ");
            builder.CloseElement();
            builder.AddMarkupContent(6, "\r\n");
#nullable restore
#line 11 "x:\dir\subdir\Test\TestComponent.cshtml"
}

#line default
#line hidden
#nullable disable
        }
        #pragma warning restore 1998
#nullable restore
#line 12 "x:\dir\subdir\Test\TestComponent.cshtml"
            
    [Parameter] TItem1 Item1 { get; set; }
    [Parameter] List<TItem2> Items2 { get; set; }
    [Parameter] RenderFragment<TItem2> ChildContent { get; set; }

#line default
#line hidden
#nullable disable
    }
}
#pragma warning restore 1591