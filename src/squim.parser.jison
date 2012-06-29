/* description: Parses the squim language. */

/* lexical grammar */
%lex
%%

\s+                    /* skip whitespace */
[0-9]+"."[0-9]+\b      return 'DECIMAL'
[0-9]+\b               return 'INTEGER'
"\"".*?"\""            return 'STRING'
[A-Za-z\-_0-9\?!:\.\+\*/%\$<>]+     return 'SYMBOL'
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
    ;


