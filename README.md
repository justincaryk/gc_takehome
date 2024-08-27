## Requirements:

1. node 20
2. openssl (`brew install openssl`)

### Getting started

1. Change the curl command to allow self-signed certs with `-k`.
2. Generate a CSR using the provided private key and Create a self-signed certificate using the CSR and private key

```bash
openssl req -new -key private_key.pem -out certificate.csr
openssl x509 -req -in certificate.csr -signkey private_key.pem -out certificate.pem -days 365
```

3. Install dependencies: `yarn`
4. Get the csv: `yarn fetch-csv`
5. Run `docker compose up -d`
6. Run `yarn migrate` to hydrate the db
7. Run `yarn seed` to munge the csv into the schema shape and run inserts

Once this is done, you should have:

- postgres instance running in docker
- a `data.csv` file in the project root
- all depedencies installed

### Running a local instance

Run `yarn dev`
Open new terminal
Run `yarn simulate`

Confirm the expected output is in the terminal

### Testing

Run `yarn test`

### Thoughts / Notes

- The db schema is outlined in the `docs/` directory
- The first major decision was whether to simply dump all the csv rows in a single table and create indexes as needed or create a more flexible model. Normally, I'd try to get stakeholder input when gathering requirements to inform the decision, but in this case, I opted to go with something a bit more extensible, but the further I got into the assignment, the more I started thinking it was the wrong approach.
  - Drawbacks of this approach:
    - The single table approach would have been a lot more simple to manage and presumably more performant.
    - This also informed the decision to seed the db by putting the whole csv into a single node process, which I think has < 2 GB memory. So if the csv had a couple orders of magnitude more rows, this likely would cause an issue. Had I went with the single table approach, streaming the data and performing inserts in chunks would have alleviated this. There may be a way to implement this type of behavior, but my cursory investigation didn't turn up anything obvious.
      Benefits of this approach:
    - The most obvious benefit to the multi-table approach is that it can potentially be useful outside the immediate context of the problem.
  - Either way, I would have liked to implement some version of batch inserts, be it a standard insert with multiple values or using a package like `pg-promise`
- Testing was tricky as most of the core functionality relies on external packages. Refactoring to improve coverage would be a priority
- Project organization would be the next step for a real world project. As it stands, it generally reflects how I implemented it, and it's a bit too disjointed IMO.

### Known Bugs

- One MAJOR bug that only occurred to me after wrapping up is related to the `user_team_status` condition. I erroneously assumed the status should be a single mutable state evaluated retroactively. In other words, all events are evaluated against their latest status. So if a user has Event A where they are marked `added` within the previous week, and later in the week there is Event B that marks them as `invited` or `removed`, Event A will not be included in the results.
  - Potential solutions:
    1. Drop table `public.user_team_status`, and add `user_team_status` to the `public.event` table. This is likely the most efficient for the current task requirements.
    2. Add a column `date_created` in `public.user_team_status`, and add it as a condition in the function. This is definitely more expensive, but it might afford a little more flexibility in answering other questions like "What is the user's current team status" or "Can we look at a user's team status history".
