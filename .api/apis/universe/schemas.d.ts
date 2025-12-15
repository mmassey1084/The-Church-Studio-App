declare const Testinput1: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly client_id: {
                    readonly type: "string";
                    readonly default: "your_client_id";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Your application client id";
                };
                readonly response_type: {
                    readonly type: "string";
                    readonly default: "code";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly redirect_uri: {
                    readonly type: "string";
                    readonly default: "https://your_app.com/callback";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Your application's registered redirect URI";
                };
            };
            readonly required: readonly ["client_id", "response_type", "redirect_uri"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const Token: {
    readonly formData: {
        readonly type: "object";
        readonly required: readonly ["code", "grant_type", "client_id", "client_secret", "redirect_uri"];
        readonly properties: {
            readonly code: {
                readonly type: "string";
                readonly description: "Auth code received from /authorize flow";
                readonly default: "AUTH_CODE";
            };
            readonly grant_type: {
                readonly type: "string";
                readonly default: "authorization_code";
            };
            readonly client_id: {
                readonly type: "string";
                readonly description: "Your application client id";
                readonly default: "YOUR_CLIENT_ID";
            };
            readonly client_secret: {
                readonly type: "string";
                readonly description: "Your application client secret";
                readonly default: "YOUR_CLIENT_SECRET";
            };
            readonly redirect_uri: {
                readonly type: "string";
                readonly description: "Your application redirect URI. This must match the redirect_uri value provided in the authorize step.";
                readonly default: "https://your_app.com/callback";
            };
        };
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly access_token: {
                    readonly type: "string";
                    readonly examples: readonly ["844...bbb"];
                };
                readonly token_type: {
                    readonly type: "string";
                    readonly examples: readonly ["bearer"];
                };
                readonly expires_in: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [2592000];
                };
                readonly refresh_token: {
                    readonly type: "string";
                    readonly examples: readonly ["006...686"];
                };
                readonly scope: {
                    readonly type: "string";
                    readonly examples: readonly ["public"];
                };
                readonly created_at: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [1494964915];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const TokenInfo: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly Authorization: {
                    readonly type: "string";
                    readonly default: "Bearer YOUR_TOKEN";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "You MUST prefix the value with 'Bearer '";
                };
            };
            readonly required: readonly ["Authorization"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["invalid_request"];
                };
                readonly error_description: {
                    readonly type: "string";
                    readonly examples: readonly ["The request is missing a required parameter, includes an unsupported parameter value, or is otherwise malformed."];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
export { Testinput1, Token, TokenInfo };
