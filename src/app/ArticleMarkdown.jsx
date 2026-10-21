import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

export default function ArticleMarkdown({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeHighlight, { detect: false }]]}
      components={{
        pre({ children }) {
          const language =
            children?.props?.className?.match(/language-([\w+-]+)/)?.[1];
          return (
            <pre tabIndex={0} data-language={language || "Excerpt"}>
              {children}
            </pre>
          );
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
