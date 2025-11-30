declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: any;
      span: any;
      p: any;
      a: any;
      button: any;
      form: any;
      input: any;
      label: any;
      h1: any;
      h2: any;
      h3: any;
      h4: any;
      h5: any;
      h6: any;
      strong: any;
      table: any;
      thead: any;
      tbody: any;
      tr: any;
      td: any;
      th: any;
      select: any;
      option: any;
      textarea: any;
      ul: any;
      li: any;
      [elemName: string]: any;
    }
  }
}

export {};
