export default function index() {
  return (
    <>
      <h1>Causal Example Projects</h1>
      <p>
        Please visit and clone our examples repo at{" "}
        <a href="https://github.com/CausalLabs/examples">
          https://github.com/CausalLabs/examples
        </a>
        .
      </p>
      <h2>Getting Started with TypeScript</h2>
      <p>
        All the examples are built on <a href="https://nextjs.org/">Next.js</a>
      </p>

      <p>
        Please view the{" "}
        <a href="https://github.com/CausalLabs/examples/tree/main/getting-started">
          getting-started
        </a>{" "}
        project, and follow along.
      </p>

      <p>
        We recommend following the examples in order as they build on each
        other.
      </p>
      <ol>
        <li>
          <a href="react-example?pid=iphone">React Example</a> (
          <a href="https://github.com/CausalLabs/examples/blob/main/getting-started/pages/react-example.tsx">
            source
          </a>
          )
        </li>
        <li>
          <a href="ssr-cache?pid=iphone">React SSR Example</a> (
          <a href="https://github.com/CausalLabs/examples/blob/main/getting-started/pages/ssr-cache.tsx">
            source
          </a>
          )
        </li>
        <li>
          <a href="ssr-props?pid=iphone">React SSR Example (alternate)</a> (
          <a href="https://github.com/CausalLabs/examples/blob/main/getting-started/pages/ssr-props.tsx">
            source
          </a>
          )
        </li>
        <li>
          <a href="events-microservice?pid=iphone">
            Microservice / Static Events Example
          </a>
          ({" "}
          <a href="https://github.com/CausalLabs/examples/blob/main/getting-started/pages/events-microservice.tsx">
            source
          </a>
          )
        </li>
      </ol>
    </>
  );
}
