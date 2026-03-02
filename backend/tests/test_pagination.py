from utils.pagination import StandardResultsPagination


def test_pagination_defaults():
    p = StandardResultsPagination()
    assert p.page_size == 20
    assert p.page_size_query_param == "page_size"
    assert p.max_page_size == 100