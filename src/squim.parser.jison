/* description: Parses the squim language. */

/* lexical grammar */
%lex
%%

";".*$                 /* ignore */
\s+                    /* skip whitespace */
"."                    return 'DOT'
[0-9]+"."[0-9]+\b      return 'DECIMAL'
[0-9]+\b               return 'INTEGER'
"#t"                   return 'TRUE'
"#f"                   return 'FALSE'
"#inert"               return 'INERT'
"#ignore"              return 'IGNORE'
"\"".*?"\""            return 'STRING'
[A-Za-z0-9!\$%&\*\+\-\./:<=>\?@\^\_~]+     return 'SYMBOL'
"("                    return '('
")"                    return ')'
<<EOF>>                return 'EOF'
.                      return 'INVALID'

/lex

%start expressions

%% /* language grammar */

expressions
    : e EOF
        { return $1; }
    ;

listItems: e                                                                   
        { $$ = new Types.Pair($1, Types.nil); }                                                         
    | e listItems
        { $$ = new Types.Pair($1, $2); }                                              
    ;  

e
    : '(' ')'
        {$$ = Types.nil;}
    | '(' listItems DOT e ')'
        {
            var pair = $2;

            while (pair.right !== Types.Pair.nil) {
                pair = pair.right;
            }

            pair.right = $4;

            $$ = $2;
        }
    | '(' listItems ')'
        {$$ = $2;}
    | INTEGER
        {$$ = new Types.Int(parseInt(yytext, 10));}
    | DECIMAL
    	{$$ = new Types.Float(parseFloat(yytext));}
    | STRING
    	{$$ = new Types.Str(yytext.slice(1, yytext.length - 1));}
    | SYMBOL
    	{$$ = new Types.Symbol(yytext);}
    | TRUE
        {$$ = Types.t;}
    | FALSE
        {$$ = Types.f;}
    | INERT
        {$$ = Types.inert;}
    | IGNORE
        {$$ = Types.ignore;}
    ;


